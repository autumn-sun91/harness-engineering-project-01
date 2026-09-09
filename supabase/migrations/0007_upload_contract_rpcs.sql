-- TxAnalyzer upload state and report access contract.
-- The source CSV remains absent from every table and is processed in memory only.

alter table public.csv_uploads
  drop constraint if exists csv_uploads_status_check;

update public.csv_uploads
   set status = 'queued'
 where status = 'uploading';

alter table public.csv_uploads
  alter column status set default 'queued';

alter table public.csv_uploads
  add constraint csv_uploads_status_check
  check (status in ('queued', 'parsing', 'analyzing', 'partial', 'completed', 'failed'));

drop index if exists public.csv_uploads_active_user_idx;

create index csv_uploads_active_user_idx
  on public.csv_uploads(user_id)
  where status in ('queued', 'parsing', 'analyzing');

create or replace function public.reserve_upload(file_name text, file_size integer)
returns table (upload_id uuid, error_code text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  current_plan text;
  current_polar_status text;
  current_cancel_at_period_end boolean;
  current_period_end timestamptz;
  monthly_limit integer;
  month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  next_month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Seoul' + interval '1 month') at time zone 'Asia/Seoul';
  uploads_this_month integer;
  new_upload_id uuid;
begin
  if current_user_id is null then
    return query select null::uuid, 'unauthorized'::text;
    return;
  end if;

  if file_name is null or btrim(file_name) = '' or file_size is null or file_size <= 0 then
    raise exception 'invalid upload metadata';
  end if;

  select s.plan, s.polar_status, s.cancel_at_period_end, s.current_period_end
    into current_plan, current_polar_status, current_cancel_at_period_end, current_period_end
    from public.subscriptions as s
   where s.user_id = current_user_id
   for update;

  if current_plan is null then
    return query select null::uuid, 'unauthorized'::text;
    return;
  end if;

  monthly_limit := case
    when current_plan = 'pro'
      and current_period_end >= now()
      and (
        current_polar_status in ('active', 'trialing')
        or (
          current_polar_status in ('canceled', 'cancelled')
          and current_cancel_at_period_end
        )
      ) then 30
    else 5
  end;

  select count(*)::integer
    into uploads_this_month
    from public.csv_uploads as u
   where u.user_id = current_user_id
     and u.status <> 'failed'
     and u.uploaded_at >= month_start
     and u.uploaded_at < next_month_start;

  if uploads_this_month >= monthly_limit then
    return query select null::uuid, 'upload_limit_reached'::text;
    return;
  end if;

  if exists (
    select 1
      from public.csv_uploads as u
     where u.user_id = current_user_id
       and u.status in ('queued', 'parsing', 'analyzing')
  ) then
    return query select null::uuid, 'analysis_in_progress'::text;
    return;
  end if;

  insert into public.csv_uploads (user_id, original_filename, file_size)
  values (current_user_id, file_name, file_size)
  returning id into new_upload_id;

  return query select new_upload_id, null::text;
end;
$function$;

revoke execute on function public.reserve_upload(text, integer) from public;
grant execute on function public.reserve_upload(text, integer) to authenticated;

create or replace function public.transition_upload(
  upload_id uuid,
  expected_status text,
  next_status text,
  metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  current_status text;
  metadata_json jsonb := coalesce($4, '{}'::jsonb);
begin
  if current_user_id is null then
    return;
  end if;

  select u.status
    into current_status
    from public.csv_uploads as u
   where u.id = $1
     and u.user_id = current_user_id
   for update;

  if not found or current_status <> $2 then
    return;
  end if;

  if not (
    (current_status = 'queued' and $3 = 'parsing')
    or (current_status = 'parsing' and $3 = 'analyzing')
    or (current_status = 'analyzing' and $3 in ('completed', 'partial', 'failed'))
    or (current_status in ('queued', 'parsing', 'analyzing') and $3 = 'failed')
  ) then
    return;
  end if;

  update public.csv_uploads as u
     set status = $3,
         row_count = case
           when metadata_json ? 'row_count' and metadata_json->>'row_count' is not null
             then (metadata_json->>'row_count')::integer
           else u.row_count
         end,
         skipped_row_count = case
           when metadata_json ? 'skipped_row_count' and metadata_json->>'skipped_row_count' is not null
             then (metadata_json->>'skipped_row_count')::integer
           else u.skipped_row_count
         end,
         error_code = case
           when metadata_json ? 'error_code' then metadata_json->>'error_code'
           else u.error_code
         end,
         scope_start = case
           when metadata_json ? 'scope_start' then (metadata_json->>'scope_start')::date
           else u.scope_start
         end,
         scope_end = case
           when metadata_json ? 'scope_end' then (metadata_json->>'scope_end')::date
           else u.scope_end
         end,
         currency = case
           when metadata_json ? 'currency' then (metadata_json->>'currency')::char(3)
           else u.currency
         end,
         started_at = case
           when metadata_json ? 'started_at' then (metadata_json->>'started_at')::timestamptz
           else u.started_at
         end,
         completed_at = case
           when metadata_json ? 'completed_at' then (metadata_json->>'completed_at')::timestamptz
           else u.completed_at
         end
   where u.id = $1
     and u.user_id = current_user_id;
end;
$function$;

revoke execute on function public.transition_upload(uuid, text, text, jsonb) from public;
grant execute on function public.transition_upload(uuid, text, text, jsonb) to authenticated;

create type public.claim_analysis_retry_result as (
  upload_id uuid,
  retry_count integer,
  error_code text
);

create or replace function public.claim_analysis_retry(upload_id uuid)
returns setof public.claim_analysis_retry_result
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  current_status text;
  current_retry_count integer;
begin
  if current_user_id is null then
    return query select null::uuid, null::integer, 'not_found'::text;
    return;
  end if;

  select u.status, u.retry_count
    into current_status, current_retry_count
    from public.csv_uploads as u
   where u.id = $1
     and u.user_id = current_user_id
   for update;

  if not found then
    return query select null::uuid, null::integer, 'not_found'::text;
    return;
  end if;

  if current_status not in ('partial', 'failed') then
    return query select null::uuid, current_retry_count, 'analysis_in_progress'::text;
    return;
  end if;

  if current_retry_count >= 3 then
    return query select null::uuid, current_retry_count, 'retry_limit_exceeded'::text;
    return;
  end if;

  update public.csv_uploads as u
     set status = 'analyzing',
         retry_count = u.retry_count + 1,
         error_code = null,
         completed_at = null
   where u.id = $1
     and u.user_id = current_user_id;

  return query select $1, current_retry_count + 1, null::text;
end;
$function$;

revoke execute on function public.claim_analysis_retry(uuid) from public;
grant execute on function public.claim_analysis_retry(uuid) to authenticated;

create or replace function public.mark_stale_upload(upload_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return;
  end if;

  update public.csv_uploads as u
     set status = 'failed',
         error_code = 'analysis_timeout',
         completed_at = now()
   where u.id = $1
     and u.user_id = current_user_id
     and u.status in ('queued', 'parsing', 'analyzing')
     and u.uploaded_at < now() - interval '10 minutes';
end;
$function$;

revoke execute on function public.mark_stale_upload(uuid) from public;
grant execute on function public.mark_stale_upload(uuid) to authenticated;

create or replace function public.get_upload_report(upload_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  payload jsonb;
  selected_scope jsonb;
  raw_interpretation jsonb;
  savings jsonb;
  anomalies jsonb;
  savings_items jsonb;
  anomaly_items jsonb;
  scope_key text;
  is_pro boolean := false;
begin
  if current_user_id is null then
    return null;
  end if;

  select ar.payload
    into payload
    from public.csv_uploads as u
    left join public.analysis_results as ar
      on ar.upload_id = u.id
     and ar.user_id = u.user_id
   where u.id = $1
     and u.user_id = current_user_id;

  if payload is null then
    return null;
  end if;

  select exists (
    select 1
      from public.subscriptions as s
     where s.user_id = current_user_id
       and s.plan = 'pro'
       and s.current_period_end >= now()
  ) into is_pro;

  scope_key := case when is_pro then 'full' else 'recent12m' end;
  selected_scope := payload->'scopes'->scope_key;

  if selected_scope is null or jsonb_typeof(selected_scope) = 'null' then
    return null;
  end if;

  raw_interpretation := selected_scope->'interpretation';
  if raw_interpretation is null or jsonb_typeof(raw_interpretation) = 'null' then
    return jsonb_build_object(
      'scope', scope_key,
      'aggregates', selected_scope->'aggregates',
      'interpretation', null::jsonb
    );
  end if;

  savings := case
    when jsonb_typeof(raw_interpretation->'savings') = 'array'
      then raw_interpretation->'savings'
    else '[]'::jsonb
  end;
  anomalies := case
    when jsonb_typeof(raw_interpretation->'anomalies') = 'array'
      then raw_interpretation->'anomalies'
    else '[]'::jsonb
  end;

  select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
    into savings_items
    from jsonb_array_elements(savings) with ordinality as entries(entry, ordinal)
   where is_pro or ordinal <= 1;

  select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
    into anomaly_items
    from jsonb_array_elements(anomalies) with ordinality as entries(entry, ordinal)
   where is_pro or ordinal <= 3;

  return jsonb_build_object(
    'scope', scope_key,
    'aggregates', selected_scope->'aggregates',
    'interpretation', jsonb_build_object(
      'summary', raw_interpretation->'summary',
      'savings', jsonb_build_object(
        'items', savings_items,
        'totalCount', jsonb_array_length(savings),
        'locked', not is_pro
      ),
      'anomalies', jsonb_build_object(
        'items', anomaly_items,
        'totalCount', jsonb_array_length(anomalies),
        'locked', not is_pro
      )
    )
  );
end;
$function$;

revoke execute on function public.get_upload_report(uuid) from public;
grant execute on function public.get_upload_report(uuid) to authenticated;
