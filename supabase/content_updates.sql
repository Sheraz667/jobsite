-- Run schema.sql first on a new project. This migration upgrades an existing project.
alter table public.sponsors add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.sponsors add column if not exists additional_links jsonb not null default '[]'::jsonb;
alter table public.blogs add column if not exists additional_links jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists additional_links jsonb not null default '[]'::jsonb;

create table if not exists public.static_pages (
  slug text primary key,
  title text not null,
  intro text not null,
  content_list jsonb not null default '[]'::jsonb,
  action_href text,
  action_label text,
  updated_at timestamptz not null default now()
);

insert into public.static_pages (slug, title, intro, content_list, action_href, action_label) values
  ('about', 'About Us', 'Pakistan Jobs Portal is an independent information platform dedicated to career opportunities across Pakistan. We curate verified public notices from official sources and present them in a clean, searchable, and easy-to-use format.', '["Independent job information service", "Responsible editorial checks", "Focus on public, active, and legitimate hiring opportunities"]'::jsonb, null, null),
  ('contact', 'Contact Us', 'We welcome queries, corrections, and partnership opportunities related to job information, admissions, and career content.', '["Support: Monday to Friday, 9:00 AM to 5:00 PM", "Response time is usually within 2 business days"]'::jsonb, 'https://docs.google.com/forms/d/e/1FAIpQLSdWBN6fBO-RPoO77wrMtMYrpBb6OtYwVG8oQQd91CsMYxLEZg/viewform?usp=header', 'Open contact form'),
  ('disclaimer', 'Disclaimer', 'We are an independent job information and updates website. We are not affiliated with any government department, recruitment agency, or official hiring authority. Job information is collected from publicly available announcements and official sources. Applicants should verify all details through the relevant official department before applying. We do not recruit candidates or guarantee employment.', '["Always verify deadlines and requirements through official channels", "We do not accept recruitment fees from applicants", "We provide information, not hiring services"]'::jsonb, null, null),
  ('privacy-policy', 'Privacy Policy', 'This portal respects user privacy and uses data responsibly to provide a better job discovery experience.', '["We do not sell personal data to third parties", "Analytics may be used to improve site performance and content quality", "Admin access remains restricted to authorized users"]'::jsonb, null, null),
  ('terms', 'Terms & Conditions', 'Use of this website is subject to compliance with local laws and responsible browsing practices.', '["Do not misuse data or attempt unauthorized access", "Information is provided as-is for public guidance", "Users must verify official announcements before applying"]'::jsonb, null, null),
  ('editorial-policy', 'Editorial Policy', 'Our editorial process is focused on accuracy, public-source transparency, and responsible job listing practices.', '["Only include published and current opportunities", "Avoid fake or misleading job claims", "Review and update listings when official notices change"]'::jsonb, null, null)
on conflict (slug) do nothing;

alter table public.static_pages enable row level security;
drop policy if exists "Public static pages are readable" on public.static_pages;
create policy "Public static pages are readable" on public.static_pages for select using (true);
drop policy if exists "Admins manage static pages" on public.static_pages;
create policy "Admins manage static pages" on public.static_pages for all
using (exists (select 1 from public.admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

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