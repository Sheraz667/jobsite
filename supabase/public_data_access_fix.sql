-- Apply to existing projects to keep admin checks private while allowing public reads.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins manage static pages" on public.static_pages;
create policy "Admins manage static pages" on public.static_pages for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage jobs" on public.jobs;
create policy "Admins manage jobs" on public.jobs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage tags" on public.tags;
create policy "Admins manage tags" on public.tags for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage job tags" on public.job_tags;
create policy "Admins manage job tags" on public.job_tags for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage sponsors" on public.sponsors;
create policy "Admins manage sponsors" on public.sponsors for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage academic updates" on public.academic_updates;
create policy "Admins manage academic updates" on public.academic_updates for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage settings" on public.website_settings;
create policy "Admins manage settings" on public.website_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage blogs" on public.blogs;
create policy "Admins manage blogs" on public.blogs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  group_key text not null check (group_key in ('quick', 'company', 'legal', 'social')),
  label text not null,
  url text not null,
  link_type text not null check (link_type in ('internal', 'external')),
  platform text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.footer_links enable row level security;
drop policy if exists "Public footer links are readable" on public.footer_links;
create policy "Public footer links are readable" on public.footer_links for select using (true);
drop policy if exists "Admins manage footer links" on public.footer_links;
create policy "Admins manage footer links" on public.footer_links for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on table public.footer_links to anon, authenticated;
grant insert, update, delete on table public.footer_links to authenticated;
create index if not exists footer_links_group_sort_idx on public.footer_links(group_key, sort_order);

insert into public.footer_links (external_id, group_key, label, url, link_type, platform, sort_order) values
  ('quick-government', 'quick', 'Government Jobs', '/government', 'internal', null, 0),
  ('quick-private', 'quick', 'Private Jobs', '/private', 'internal', null, 1),
  ('quick-internship', 'quick', 'Internships', '/internship', 'internal', null, 2),
  ('quick-apprenticeship', 'quick', 'Apprenticeships', '/apprenticeship', 'internal', null, 3),
  ('quick-police', 'quick', 'Police & Forces', '/police', 'internal', null, 4),
  ('quick-banking', 'quick', 'Banking Jobs', '/banking', 'internal', null, 5),
  ('company-about', 'company', 'About Us', '/about', 'internal', null, 0),
  ('company-contact', 'company', 'Contact Us', '/contact', 'internal', null, 1),
  ('company-privacy', 'company', 'Privacy Policy', '/privacy-policy', 'internal', null, 2),
  ('company-terms', 'company', 'Terms & Conditions', '/terms', 'internal', null, 3),
  ('legal-disclaimer', 'legal', 'Disclaimer', '/disclaimer', 'internal', null, 0),
  ('legal-editorial', 'legal', 'Editorial Policy', '/editorial-policy', 'internal', null, 1),
  ('legal-sitemap', 'legal', 'Sitemap', '/sitemap.xml', 'internal', null, 2),
  ('social-instagram', 'social', 'Instagram', 'https://www.instagram.com/pakjobinfo.pk?dlrf=eXB1NXpydHc5Nngw', 'external', 'instagram', 0),
  ('social-facebook', 'social', 'Facebook', 'https://www.facebook.com/share/1A7eS5HroF/', 'external', 'facebook', 1),
  ('social-pinterest', 'social', 'Pinterest', 'https://pin.it/50hkAlHKp', 'external', 'pinterest', 2),
  ('social-tiktok', 'social', 'TikTok', 'https://www.tiktok.com/@pakjobinfo5?_r=1&_t=ZN-9BLESJyTf7r', 'external', 'tiktok', 3)
on conflict (external_id) do nothing;
