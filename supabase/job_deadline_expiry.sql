-- Run this once on an existing project to close expired job applications automatically.
create extension if not exists pg_cron;

drop policy if exists "Public jobs are readable" on public.jobs;
create policy "Public jobs are readable" on public.jobs for select using (
  status in ('Published','Open','Closing Soon','Coming Soon','Closed','Expired')
);

select cron.unschedule(jobid) from cron.job where jobname = 'expire-past-deadline-jobs';
select cron.schedule(
  'expire-past-deadline-jobs',
  '5 19 * * *',
  $job$update public.jobs set status = 'Expired', updated_at = now() where status in ('Published','Open','Closing Soon','Coming Soon') and deadline < (now() at time zone 'Asia/Karachi')::date;$job$
);

update public.jobs set status = 'Expired', updated_at = now()
where status in ('Published','Open','Closing Soon','Coming Soon')
  and deadline < (now() at time zone 'Asia/Karachi')::date;