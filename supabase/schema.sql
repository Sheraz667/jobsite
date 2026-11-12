create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  department text not null,
  category_id uuid references categories(id),
  category_slug text,
  subcategory text,
  description text not null,
  qualification text,
  age_limit text,
  experience text,
  salary text,
  location text,
  province text,
  city text,
  vacancies integer,
  start_date date,
  deadline date,
  status text not null default 'Draft' check (status in ('Draft','Published','Coming Soon','Open','Closing Soon','Closed','Expired')),
  thumbnail_url text,
  advertisement_url text,
  official_apply_url text,
  official_source_url text,
  seo_title text,
  seo_description text,
  seo_keywords text[] default '{}',
  featured boolean default false,
  external_id text unique,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists job_tags (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  created_at timestamptz default now()
);

alter table jobs add column if not exists category_slug text;
alter table jobs add column if not exists subcategory text;
alter table jobs add column if not exists seo_keywords text[] default '{}';
alter table jobs add column if not exists featured boolean default false;
alter table jobs add column if not exists external_id text unique;

create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  slug text unique not null,
  excerpt text not null,
  content text not null,
  thumbnail_url text,
  social_links jsonb not null default '{}'::jsonb,
  status text not null default 'Draft' check (status in ('Draft','Published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blogs add column if not exists social_links jsonb not null default '{}'::jsonb;

create table if not exists admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

alter table admin_profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists admin_profiles_user_id_idx on admin_profiles(user_id);

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  description text not null,
  thumbnail_url text not null,
  destination_url text not null,
  status text not null default 'Draft' check (status in ('Draft','Published')),
  expiry_days integer,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sponsors add column if not exists expiry_days integer;
alter table sponsors add column if not exists expires_at timestamptz;
alter table sponsors drop constraint if exists sponsors_status_check;
alter table sponsors add constraint sponsors_status_check check (status in ('Draft','Published','Closed'));
alter table sponsors drop constraint if exists sponsors_expiry_days_check;
alter table sponsors add constraint sponsors_expiry_days_check check (expiry_days is null or expiry_days in (3, 7, 10));

alter table sponsors enable row level security;
create index if not exists sponsors_status_idx on sponsors(status);
create index if not exists sponsors_expiry_idx on sponsors(expires_at) where status = 'Published';
drop policy if exists "Public published sponsors are readable" on sponsors;
create policy "Public published sponsors are readable" on sponsors for select using (status = 'Published' and (expires_at is null or expires_at > now()));
drop policy if exists "Admins manage sponsors" on sponsors;
create policy "Admins manage sponsors" on sponsors for all
using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'close-expired-sponsors';
select cron.schedule(
  'close-expired-sponsors',
  '*/15 * * * *',
  $job$update public.sponsors set status = 'Closed', updated_at = now() where status = 'Published' and expires_at <= now();$job$
);

create table if not exists website_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text,
  tagline text,
  contact_email text,
  contact_phone text,
  updated_at timestamptz default now()
);

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  page_slug text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists jobs_category_idx on jobs(category_id);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_deadline_idx on jobs(deadline);
create index if not exists jobs_slug_idx on jobs(slug);

alter table jobs enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table job_tags enable row level security;
alter table admin_profiles enable row level security;
alter table website_settings enable row level security;
alter table blogs enable row level security;

drop policy if exists "Public jobs are readable" on jobs;
create policy "Public jobs are readable" on jobs
for select using (status in ('Published','Open','Closing Soon','Coming Soon'));

drop policy if exists "Admins manage jobs" on jobs;
create policy "Admins manage jobs" on jobs
for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

drop policy if exists "Public categories readable" on categories;
create policy "Public categories readable" on categories for select using (true);
drop policy if exists "Admins manage categories" on categories;
create policy "Admins manage categories" on categories for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

drop policy if exists "Public tags readable" on tags;
create policy "Public tags readable" on tags for select using (true);
drop policy if exists "Admins manage tags" on tags;
create policy "Admins manage tags" on tags for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

drop policy if exists "Public job tag joins readable" on job_tags;
create policy "Public job tag joins readable" on job_tags for select using (true);
drop policy if exists "Admins manage job tags" on job_tags;
create policy "Admins manage job tags" on job_tags for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can read profile" on admin_profiles;
drop policy if exists "Admins can read own profile" on admin_profiles;
create policy "Admins can read own profile" on admin_profiles for select using (user_id = auth.uid());
drop policy if exists "Admins manage settings" on website_settings;
create policy "Admins manage settings" on website_settings for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create index if not exists blogs_status_idx on blogs(status);
create index if not exists blogs_slug_idx on blogs(slug);

drop policy if exists "Public published blogs are readable" on blogs;
create policy "Public published blogs are readable" on blogs for select using (status = 'Published');
drop policy if exists "Admins manage blogs" on blogs;
create policy "Admins manage blogs" on blogs for all using (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from admin_profiles p where p.user_id = auth.uid() and p.role = 'admin'));
