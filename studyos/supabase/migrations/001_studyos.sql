begin;
create table public.users (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'profile' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index users_owner_date on public.users (user_id, (payload->>'date'));
alter table public.users enable row level security;
create policy owned on public.users for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.users to authenticated;

create table public.assignments (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'assignment' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index assignments_owner_date on public.assignments (user_id, (payload->>'date'));
alter table public.assignments enable row level security;
create policy owned on public.assignments for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.assignments to authenticated;

create table public.exams (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'exam' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index exams_owner_date on public.exams (user_id, (payload->>'date'));
alter table public.exams enable row level security;
create policy owned on public.exams for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.exams to authenticated;

create table public.tasks (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'task' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index tasks_owner_date on public.tasks (user_id, (payload->>'date'));
alter table public.tasks enable row level security;
create policy owned on public.tasks for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.tasks to authenticated;

create table public.habits (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'habit' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index habits_owner_date on public.habits (user_id, (payload->>'date'));
alter table public.habits enable row level security;
create policy owned on public.habits for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.habits to authenticated;

create table public.habit_logs (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'habitLog' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index habit_logs_owner_date on public.habit_logs (user_id, (payload->>'date'));
alter table public.habit_logs enable row level security;
create policy owned on public.habit_logs for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.habit_logs to authenticated;

create table public.pomodoro_sessions (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'pomodoro' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index pomodoro_sessions_owner_date on public.pomodoro_sessions (user_id, (payload->>'date'));
alter table public.pomodoro_sessions enable row level security;
create policy owned on public.pomodoro_sessions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.pomodoro_sessions to authenticated;

create table public.study_sessions (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'session' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index study_sessions_owner_date on public.study_sessions (user_id, (payload->>'date'));
alter table public.study_sessions enable row level security;
create policy owned on public.study_sessions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.study_sessions to authenticated;

create table public.notes (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'note' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index notes_owner_date on public.notes (user_id, (payload->>'date'));
alter table public.notes enable row level security;
create policy owned on public.notes for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.notes to authenticated;

create table public.goals (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'goal' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index goals_owner_date on public.goals (user_id, (payload->>'date'));
alter table public.goals enable row level security;
create policy owned on public.goals for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.goals to authenticated;

create table public.calendar_events (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'event' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index calendar_events_owner_date on public.calendar_events (user_id, (payload->>'date'));
alter table public.calendar_events enable row level security;
create policy owned on public.calendar_events for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.calendar_events to authenticated;

create table public.notifications (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'notification' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index notifications_owner_date on public.notifications (user_id, (payload->>'date'));
alter table public.notifications enable row level security;
create policy owned on public.notifications for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.notifications to authenticated;

create table public.subjects (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'subject' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index subjects_owner_date on public.subjects (user_id, (payload->>'date'));
alter table public.subjects enable row level security;
create policy owned on public.subjects for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.subjects to authenticated;

create table public.attendance_records (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 payload jsonb not null check (payload->>'kind' = 'attendance' and jsonb_typeof(payload->'title') = 'string'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);
create index attendance_records_owner_date on public.attendance_records (user_id, (payload->>'date'));
alter table public.attendance_records enable row level security;
create policy owned on public.attendance_records for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update on public.attendance_records to authenticated;
create unique index one_profile on public.users (user_id) where coalesce((payload->>'deleted')::boolean,false)=false;
create unique index one_habit_per_day on public.habit_logs(user_id,(payload->>'parent'),(payload->>'date')) where coalesce((payload->>'deleted')::boolean,false)=false;
create or replace function public.save_study_records(items jsonb) returns setof jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare item jsonb; tbl text; next_version int; expected int; record_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>5000 then raise exception 'Invalid batch size'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
 for item in select value from jsonb_array_elements(items) loop
  tbl := case item->>'kind' when 'profile' then 'users' when 'assignment' then 'assignments' when 'exam' then 'exams' when 'task' then 'tasks' when 'habit' then 'habits' when 'habitLog' then 'habit_logs' when 'pomodoro' then 'pomodoro_sessions' when 'session' then 'study_sessions' when 'note' then 'notes' when 'goal' then 'goals' when 'event' then 'calendar_events' when 'notification' then 'notifications' when 'subject' then 'subjects' when 'attendance' then 'attendance_records' else null end;
  if tbl is null or length(item->>'title')>500 or octet_length(item::text)>2097152 then raise exception 'Invalid record'; end if;
  record_id := (item->>'id')::uuid; expected := (item->>'version')::integer; next_version := null;
  if expected=0 then
   execute format('insert into public.%I(id,user_id,payload) values($1,auth.uid(),$2) on conflict (id) do nothing returning version',tbl) into next_version using record_id,item;
  else
   execute format('update public.%I set payload=$1, version=version+1, updated_at=now() where id=$2 and user_id=auth.uid() and version=$3 returning version',tbl) into next_version using item,record_id,expected;
  end if;
  if next_version is null then
   execute format('select version from public.%I where id=$1 and user_id=auth.uid() and payload=$2',tbl) into next_version using record_id,item;
   if next_version is null then raise exception 'Workspace changed on another device. Review sync conflicts in Settings.' using errcode='40001'; end if;
  end if;
  return next item || jsonb_build_object('version',next_version);
 end loop;
end $$;
revoke all on function public.save_study_records(jsonb) from public,anon;
grant execute on function public.save_study_records(jsonb) to authenticated;
insert into storage.buckets (id,name,public,file_size_limit) values ('study-files','study-files',false,10485760) on conflict(id) do nothing;
create policy study_files_access on storage.objects for all to authenticated using (bucket_id='study-files' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='study-files' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
