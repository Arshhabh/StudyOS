begin;
-- Record writes go through the compare-and-swap function, including retries.
do $$
declare tbl text;
begin
 foreach tbl in array array['users','assignments','exams','tasks','habits','habit_logs','pomodoro_sessions','study_sessions','notes','goals','calendar_events','notifications','subjects','attendance_records'] loop
  execute format('revoke all on table public.%I from public, anon, authenticated',tbl);
  execute format('grant select on table public.%I to authenticated',tbl);
  execute format('alter table public.%I add check (payload->>''id'' = id::text and payload ?& array[''title'',''id'',''kind'',''date'',''status'',''subject'',''time'',''body'',''updated''])',tbl);
 end loop;
end $$;
alter function public.save_study_records(jsonb) security definer;
alter function public.save_study_records(jsonb) set search_path=pg_catalog,pg_temp;

create table public.assistant_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null, requests integer not null check (requests>0)
);
alter table public.assistant_usage enable row level security;
revoke all on table public.assistant_usage from public, anon, authenticated;
create function public.reserve_assistant_request() returns boolean
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare current_count integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.assistant_usage(user_id,window_start,requests) values(auth.uid(),date_trunc('hour',now()),1)
 on conflict(user_id) do update set
  requests=case when public.assistant_usage.window_start=excluded.window_start then public.assistant_usage.requests+1 else 1 end,
  window_start=excluded.window_start
 where public.assistant_usage.window_start<excluded.window_start or public.assistant_usage.requests<30
 returning requests into current_count;
 return current_count is not null;
end $$;
revoke all on function public.reserve_assistant_request() from public, anon;
grant execute on function public.reserve_assistant_request() to authenticated;
commit;
