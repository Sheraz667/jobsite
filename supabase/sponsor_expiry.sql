-- For a new Supabase project, run schema.sql first to create the sponsors and admin_profiles tables.
alter table public.sponsors add column if not exists expiry_days integer;
alter table public.sponsors add column if not exists expires_at timestamptz;
alter table public.sponsors drop constraint if exists sponsors_status_check;
alter table public.sponsors add constraint sponsors_status_check check (status in ('Draft','Published','Closed'));
alter table public.sponsors drop constraint if exists sponsors_expiry_days_check;
alter table public.sponsors add constraint sponsors_expiry_days_check check (expiry_days is null or expiry_days in (3, 7, 10));

create index if not exists sponsors_expiry_idx on public.sponsors(expires_at) where status = 'Published';

drop policy if exists "Public published sponsors are readable" on public.sponsors;
create policy "Public published sponsors are readable" on public.sponsors
for select using (status = 'Published' and (expires_at is null or expires_at > now()));

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'close-expired-sponsors';
select cron.schedule(
  'close-expired-sponsors',
  '*/15 * * * *',
  $job$update public.sponsors set status = 'Closed', updated_at = now() where status = 'Published' and expires_at <= now();$job$
);