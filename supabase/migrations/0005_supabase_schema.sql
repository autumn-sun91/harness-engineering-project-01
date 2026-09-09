-- TxAnalyzer schema
-- The source CSV is intentionally absent from every table and is processed in memory only.

create extension if not exists "pgcrypto";

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  polar_status text,
  polar_customer_id text,
  polar_subscription_id text,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  last_event_id text,
  last_event_ts timestamptz,
  updated_at timestamptz not null default now()
);

create table public.csv_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_filename text not null,
  file_size integer not null check (file_size > 0 and file_size <= 4000000),
  row_count integer not null default 0 check (row_count >= 0),
  skipped_row_count integer not null default 0 check (skipped_row_count >= 0),
  status text not null default 'uploading'
    check (status in ('uploading', 'parsing', 'analyzing', 'completed', 'failed')),
  error_code text,
  scope_start date,
  scope_end date,
  currency char(3),
  retry_count integer not null default 0 check (retry_count >= 0),
  uploaded_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.csv_uploads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  description text not null,
  merchant_normalized text not null,
  amount numeric(14,2) not null,
  kind text not null check (kind in ('debit', 'credit')),
  currency char(3) not null,
  category text not null default '기타'
    check (category in ('식비', '교통', '주거', '통신', '의료', '쇼핑', '구독', '기타')),
  created_at timestamptz not null default now()
);

create table public.analysis_results (
  upload_id uuid primary key references public.csv_uploads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  generated_at timestamptz not null default now()
);

create index transactions_upload_id_idx
  on public.transactions(upload_id);

create index transactions_upload_id_occurred_on_idx
  on public.transactions(upload_id, occurred_on);

create index csv_uploads_user_uploaded_at_idx
  on public.csv_uploads(user_id, uploaded_at desc);

create index csv_uploads_active_user_idx
  on public.csv_uploads(user_id)
  where status in ('uploading', 'parsing', 'analyzing');

alter table public.subscriptions enable row level security;
alter table public.csv_uploads enable row level security;
alter table public.transactions enable row level security;
alter table public.analysis_results enable row level security;

revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.csv_uploads from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;
revoke all on table public.analysis_results from anon, authenticated;

grant select on table public.subscriptions to authenticated;
grant select on table public.csv_uploads to authenticated;
grant insert on table public.transactions to authenticated;
grant insert, update on table public.analysis_results to authenticated;

create policy subscriptions_select_own
  on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create policy csv_uploads_select_own
  on public.csv_uploads
  for select to authenticated
  using (auth.uid() = user_id);

create policy transactions_insert_own
  on public.transactions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy analysis_results_insert_own
  on public.analysis_results
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy analysis_results_update_own
  on public.analysis_results
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.reserve_upload(file_name text, file_size integer)
returns table (upload_id uuid, error_code text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  current_plan text;
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

  select s.plan, s.current_period_end
    into current_plan, current_period_end
    from public.subscriptions as s
   where s.user_id = current_user_id
   for update;

  if current_plan is null then
    return query select null::uuid, 'unauthorized'::text;
    return;
  end if;

  monthly_limit := case
    when current_plan = 'pro' and current_period_end >= now() then 30
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
