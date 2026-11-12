-- Run schema.sql first on a new project. This migration upgrades an existing project.
alter table public.sponsors add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.sponsors add column if not exists additional_links jsonb not null default '[]'::jsonb;
alter table public.blogs add column if not exists additional_links jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists additional_links jsonb not null default '[]'::jsonb;

drop policy if exists "Public jobs are readable" on public.jobs;
create policy "Public jobs are readable" on public.jobs for select using (
  status in ('Published','Open','Closing Soon','Coming Soon','Closed','Expired')
);

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'expire-past-deadline-jobs';
select cron.schedule(
  'expire-past-deadline-jobs',
  '5 19 * * *',
  $job$update public.jobs set status = 'Expired', updated_at = now() where status in ('Published','Open','Closing Soon','Coming Soon') and deadline < (now() at time zone 'Asia/Karachi')::date;$job$
);
update public.jobs set status = 'Expired', updated_at = now()
where status in ('Published','Open','Closing Soon','Coming Soon')
  and deadline < (now() at time zone 'Asia/Karachi')::date;

create table if not exists public.academic_updates (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  kind text not null check (kind in ('admissions', 'results')),
  title text not null,
  department text not null,
  details text not null,
  thumbnail_url text,
  source_url text not null,
  action_url text not null,
  additional_links jsonb not null default '[]'::jsonb,
  status text not null default 'Draft' check (status in ('Draft', 'Published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academic_updates add column if not exists additional_links jsonb not null default '[]'::jsonb;
alter table public.academic_updates add column if not exists thumbnail_url text;

alter table public.academic_updates enable row level security;
create index if not exists academic_updates_kind_status_created_idx on public.academic_updates(kind, status, created_at desc);

drop policy if exists "Public published academic updates are readable" on public.academic_updates;
create policy "Public published academic updates are readable" on public.academic_updates
for select using (status = 'Published');

drop policy if exists "Admins manage academic updates" on public.academic_updates;
create policy "Admins manage academic updates" on public.academic_updates for all
using (exists (select 1 from public.admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));