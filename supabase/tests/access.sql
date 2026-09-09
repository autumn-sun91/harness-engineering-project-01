begin;

create extension if not exists pgtap;
create extension if not exists dblink;

select plan(24);

-- Synthetic users only. No real financial data is used in database tests.
\set user_a 00000000-0000-0000-0000-000000000001
\set user_b 00000000-0000-0000-0000-000000000002
\set user_c 00000000-0000-0000-0000-000000000003
\set upload_report 10000000-0000-0000-0000-000000000001
\set upload_other 10000000-0000-0000-0000-000000000002
\set upload_transition 10000000-0000-0000-0000-000000000003
\set upload_metadata 10000000-0000-0000-0000-000000000004
\set upload_retry 10000000-0000-0000-0000-000000000005
\set upload_fresh 10000000-0000-0000-0000-000000000006
\set upload_stale 10000000-0000-0000-0000-000000000007

delete from auth.users
 where id in (:'user_a'::uuid, :'user_b'::uuid, :'user_c'::uuid);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at)
values
  (:'user_a'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'db-contract-a@example.test', now()),
  (:'user_b'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'db-contract-b@example.test', now()),
  (:'user_c'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'db-contract-c@example.test', now());

insert into public.csv_uploads (id, user_id, original_filename, file_size, status)
values
  (:'upload_report'::uuid, :'user_a'::uuid, 'report.csv', 100, 'completed'),
  (:'upload_other'::uuid, :'user_b'::uuid, 'other.csv', 100, 'completed'),
  (:'upload_transition'::uuid, :'user_a'::uuid, 'transition.csv', 100, 'parsing'),
  (:'upload_metadata'::uuid, :'user_a'::uuid, 'metadata.csv', 100, 'parsing'),
  (:'upload_retry'::uuid, :'user_a'::uuid, 'retry.csv', 100, 'failed'),
  (:'upload_fresh'::uuid, :'user_a'::uuid, 'fresh.csv', 100, 'parsing'),
  (:'upload_stale'::uuid, :'user_a'::uuid, 'stale.csv', 100, 'analyzing');

update public.csv_uploads
   set uploaded_at = now() - interval '5 minutes'
 where id = :'upload_fresh'::uuid;

update public.csv_uploads
   set uploaded_at = now() - interval '11 minutes'
 where id = :'upload_stale'::uuid;

insert into public.analysis_results (upload_id, user_id, payload)
values (
  :'upload_report'::uuid,
  :'user_a'::uuid,
  jsonb_build_object(
    'schemaVersion', 1,
    'scopes', jsonb_build_object(
      'recent12m', jsonb_build_object(
        'aggregates', jsonb_build_object('source', 'recent'),
        'interpretation', jsonb_build_object(
          'summary', 'recent summary',
          'savings', jsonb_build_array(
            jsonb_build_object('title', 'saving 1', 'description', 'description 1'),
            jsonb_build_object('title', 'saving 2', 'description', 'description 2'),
            jsonb_build_object('title', 'saving 3', 'description', 'description 3'),
            jsonb_build_object('title', 'saving 4', 'description', 'description 4')
          ),
          'anomalies', jsonb_build_array(
            jsonb_build_object('title', 'anomaly 1', 'description', 'description 1'),
            jsonb_build_object('title', 'anomaly 2', 'description', 'description 2'),
            jsonb_build_object('title', 'anomaly 3', 'description', 'description 3'),
            jsonb_build_object('title', 'anomaly 4', 'description', 'description 4'),
            jsonb_build_object('title', 'anomaly 5', 'description', 'description 5')
          )
        )
      ),
      'full', jsonb_build_object(
        'aggregates', jsonb_build_object('source', 'full'),
        'interpretation', jsonb_build_object(
          'summary', 'full summary',
          'savings', jsonb_build_array(
            jsonb_build_object('title', 'saving 1', 'description', 'description 1'),
            jsonb_build_object('title', 'saving 2', 'description', 'description 2'),
            jsonb_build_object('title', 'saving 3', 'description', 'description 3'),
            jsonb_build_object('title', 'saving 4', 'description', 'description 4')
          ),
          'anomalies', jsonb_build_array(
            jsonb_build_object('title', 'anomaly 1', 'description', 'description 1'),
            jsonb_build_object('title', 'anomaly 2', 'description', 'description 2'),
            jsonb_build_object('title', 'anomaly 3', 'description', 'description 3'),
            jsonb_build_object('title', 'anomaly 4', 'description', 'description 4'),
            jsonb_build_object('title', 'anomaly 5', 'description', 'description 5')
          )
        )
      )
    ),
    'usage', jsonb_build_object('inputTokens', 0, 'outputTokens', 0, 'model', 'claude-sonnet-5')
  )
);

select ok(
  not has_table_privilege('authenticated', 'public.transactions', 'SELECT'),
  'authenticated cannot directly select transactions'
);
select ok(
  not has_table_privilege('authenticated', 'public.analysis_results', 'SELECT'),
  'authenticated cannot directly select analysis results'
);

select set_config('request.jwt.claim.sub', :'user_b', false);
select is(
  public.get_upload_report(:'upload_report'::uuid),
  null::jsonb,
  'a different user cannot read the report'
);

select set_config('request.jwt.claim.sub', :'user_a', false);
select is(
  public.get_upload_report(:'upload_report'::uuid)->>'scope',
  'recent12m',
  'a free user receives the recent12m scope'
);
select ok(
  not (public.get_upload_report(:'upload_report'::uuid) ? 'full'),
  'a free response does not contain the full scope'
);
select ok(
  jsonb_array_length(public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'savings'->'items') <= 1,
  'free savings are limited to one item'
);
select ok(
  jsonb_array_length(public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'anomalies'->'items') <= 3,
  'free anomalies are limited to three items'
);
select is(
  public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'savings'->>'locked',
  'true',
  'free savings are marked locked'
);
select is(
  public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'anomalies'->>'locked',
  'true',
  'free anomalies are marked locked'
);

update public.subscriptions
   set plan = 'pro',
       current_period_end = now() + interval '1 month'
 where user_id = :'user_a'::uuid;

select is(
  public.get_upload_report(:'upload_report'::uuid)->>'scope',
  'full',
  'an upgrade exposes full without reanalysis'
);
select is(
  public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'savings'->>'locked',
  'false',
  'pro savings are not locked'
);
select is(
  public.get_upload_report(:'upload_report'::uuid)->'interpretation'->'anomalies'->>'locked',
  'false',
  'pro anomalies are not locked'
);

update public.subscriptions
   set current_period_end = now() - interval '1 second'
 where user_id = :'user_a'::uuid;

select is(
  public.get_upload_report(:'upload_report'::uuid)->>'scope',
  'recent12m',
  'an expired pro subscription is treated as free'
);

select public.transition_upload(
  :'upload_transition'::uuid,
  'queued',
  'analyzing',
  '{}'::jsonb
);
select is(
  (select status from public.csv_uploads where id = :'upload_transition'::uuid),
  'parsing',
  'a mismatched expected status does not transition the upload'
);

select public.transition_upload(
  :'upload_metadata'::uuid,
  'parsing',
  'analyzing',
  jsonb_build_object(
    'row_count', 7,
    'user_id', :'user_b'::text,
    'retry_count', 99
  )
);
select is(
  (select row_count from public.csv_uploads where id = :'upload_metadata'::uuid),
  7,
  'transition metadata updates an allowed field'
);
select is(
  (select user_id from public.csv_uploads where id = :'upload_metadata'::uuid),
  :'user_a'::uuid,
  'transition metadata cannot change ownership'
);
select is(
  (select retry_count from public.csv_uploads where id = :'upload_metadata'::uuid),
  0,
  'transition metadata cannot change retry count'
);

select (public.claim_analysis_retry(:'upload_retry'::uuid)).*;
select is(
  (select retry_count from public.csv_uploads where id = :'upload_retry'::uuid),
  1,
  'the first retry claim increments retry_count'
);
update public.csv_uploads
   set status = 'failed'
 where id = :'upload_retry'::uuid;
select (public.claim_analysis_retry(:'upload_retry'::uuid)).*;
update public.csv_uploads
   set status = 'failed'
 where id = :'upload_retry'::uuid;
select (public.claim_analysis_retry(:'upload_retry'::uuid)).*;
update public.csv_uploads
   set status = 'failed'
 where id = :'upload_retry'::uuid;
select is(
  (select error_code from public.claim_analysis_retry(:'upload_retry'::uuid)),
  'retry_limit_exceeded',
  'the fourth retry claim is rejected'
);

select public.mark_stale_upload(:'upload_fresh'::uuid);
select is(
  (select status from public.csv_uploads where id = :'upload_fresh'::uuid),
  'parsing',
  'a fresh active upload is not marked stale'
);

select public.mark_stale_upload(:'upload_stale'::uuid);
select is(
  (select status from public.csv_uploads where id = :'upload_stale'::uuid),
  'failed',
  'an old active upload is marked failed'
);
select is(
  (select error_code from public.csv_uploads where id = :'upload_stale'::uuid),
  'analysis_timeout',
  'a stale upload receives the timeout error code'
);

commit;
begin;

select dblink_connect(
  'reserve_a',
  'host=supabase_db_harness-engineering-project-01 port=5432 dbname=postgres user=postgres password=postgres'
);
select dblink_connect(
  'reserve_b',
  'host=supabase_db_harness-engineering-project-01 port=5432 dbname=postgres user=postgres password=postgres'
);
select dblink_exec(
  'reserve_a',
  format('set request.jwt.claim.sub = %L', :'user_c')
);
select dblink_exec(
  'reserve_b',
  format('set request.jwt.claim.sub = %L', :'user_c')
);
select dblink_send_query('reserve_a', 'select * from public.reserve_upload(''first.csv'', 100)');
select dblink_send_query('reserve_b', 'select * from public.reserve_upload(''second.csv'', 100)');

create temporary table reserve_results (
  connection_name text,
  upload_id uuid,
  error_code text
);

insert into reserve_results
select 'reserve_a', result.upload_id, result.error_code
  from dblink_get_result('reserve_a') as result(upload_id uuid, error_code text);
insert into reserve_results
select 'reserve_b', result.upload_id, result.error_code
  from dblink_get_result('reserve_b') as result(upload_id uuid, error_code text);

select ok(
  (select count(*) = 1 from reserve_results where upload_id is not null),
  'exactly one concurrent reserve gets an upload id'
);
select ok(
  (select count(*) = 1
     from reserve_results
    where error_code = 'analysis_in_progress'),
  'exactly one concurrent reserve is rejected as active'
);
select dblink_disconnect('reserve_a');
select dblink_disconnect('reserve_b');

select * from finish();
rollback;
