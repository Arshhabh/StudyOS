begin;
create sequence public.study_change_sequence;
create function public.stamp_study_change() returns trigger
language plpgsql set search_path=pg_catalog,pg_temp as $$
begin
 new.sync_seq := nextval('public.study_change_sequence');
 return new;
end $$;
alter table public.users add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index users_sync on public.users(user_id,sync_seq);
create trigger sync_update before update on public.users for each row execute function public.stamp_study_change();
alter table public.assignments add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index assignments_sync on public.assignments(user_id,sync_seq);
create trigger sync_update before update on public.assignments for each row execute function public.stamp_study_change();
alter table public.exams add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index exams_sync on public.exams(user_id,sync_seq);
create trigger sync_update before update on public.exams for each row execute function public.stamp_study_change();
alter table public.tasks add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index tasks_sync on public.tasks(user_id,sync_seq);
create trigger sync_update before update on public.tasks for each row execute function public.stamp_study_change();
alter table public.habits add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index habits_sync on public.habits(user_id,sync_seq);
create trigger sync_update before update on public.habits for each row execute function public.stamp_study_change();
alter table public.habit_logs add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index habit_logs_sync on public.habit_logs(user_id,sync_seq);
create trigger sync_update before update on public.habit_logs for each row execute function public.stamp_study_change();
alter table public.pomodoro_sessions add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index pomodoro_sessions_sync on public.pomodoro_sessions(user_id,sync_seq);
create trigger sync_update before update on public.pomodoro_sessions for each row execute function public.stamp_study_change();
alter table public.study_sessions add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index study_sessions_sync on public.study_sessions(user_id,sync_seq);
create trigger sync_update before update on public.study_sessions for each row execute function public.stamp_study_change();
alter table public.notes add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index notes_sync on public.notes(user_id,sync_seq);
create trigger sync_update before update on public.notes for each row execute function public.stamp_study_change();
alter table public.goals add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index goals_sync on public.goals(user_id,sync_seq);
create trigger sync_update before update on public.goals for each row execute function public.stamp_study_change();
alter table public.calendar_events add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index calendar_events_sync on public.calendar_events(user_id,sync_seq);
create trigger sync_update before update on public.calendar_events for each row execute function public.stamp_study_change();
alter table public.notifications add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index notifications_sync on public.notifications(user_id,sync_seq);
create trigger sync_update before update on public.notifications for each row execute function public.stamp_study_change();
alter table public.subjects add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index subjects_sync on public.subjects(user_id,sync_seq);
create trigger sync_update before update on public.subjects for each row execute function public.stamp_study_change();
alter table public.attendance_records add column sync_seq bigint not null default nextval('public.study_change_sequence');
create index attendance_records_sync on public.attendance_records(user_id,sync_seq);
create trigger sync_update before update on public.attendance_records for each row execute function public.stamp_study_change();
create function public.read_study_changes(after_seq bigint default 0)
returns table (payload jsonb, version integer, cursor_value text)
language sql stable security invoker set search_path=pg_catalog,pg_temp as $$
 select r.payload,r.version,r.sync_seq::text from (
 select payload,version,sync_seq from public.users where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.assignments where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.exams where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.tasks where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.habits where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.habit_logs where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.pomodoro_sessions where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.study_sessions where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.notes where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.goals where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.calendar_events where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.notifications where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.subjects where user_id=auth.uid() and sync_seq>after_seq
 union all
 select payload,version,sync_seq from public.attendance_records where user_id=auth.uid() and sync_seq>after_seq
 ) r order by r.sync_seq limit 500;
$$;
revoke all on function public.read_study_changes(bigint) from public,anon;
grant execute on function public.read_study_changes(bigint) to authenticated;
commit;
