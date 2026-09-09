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
       and u.status in ('uploading', 'parsing', 'analyzing')
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

create or replace function public.sync_polar_subscription(
  p_plan text,
  p_polar_status text,
  p_polar_customer_id text,
  p_polar_subscription_id text,
  p_cancel_at_period_end boolean,
  p_current_period_end timestamptz,
  p_last_event_id text,
  p_last_event_ts timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or p_plan not in ('free', 'pro') then
    raise exception 'unauthorized subscription sync';
  end if;

  update public.subscriptions
     set plan = p_plan,
         polar_status = p_polar_status,
         polar_customer_id = p_polar_customer_id,
         polar_subscription_id = p_polar_subscription_id,
         cancel_at_period_end = p_cancel_at_period_end,
         current_period_end = p_current_period_end,
         last_event_id = p_last_event_id,
         last_event_ts = p_last_event_ts,
         updated_at = now()
   where user_id = current_user_id
     and (
       last_event_ts is null
       or p_last_event_ts is null
       or p_last_event_ts >= last_event_ts
     );
end;
$function$;

revoke all on function public.sync_polar_subscription(text, text, text, text, boolean, timestamptz, text, timestamptz) from public;
grant execute on function public.sync_polar_subscription(text, text, text, text, boolean, timestamptz, text, timestamptz) to authenticated;
