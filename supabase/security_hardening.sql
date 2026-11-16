-- Run schema.sql first. This migration closes client-side access to unused telemetry
-- and limits admin profile access to a user's own profile.
alter table public.admin_profiles enable row level security;
drop policy if exists "Admins can read profile" on public.admin_profiles;
drop policy if exists "Admins can read own profile" on public.admin_profiles;
create policy "Admins can read own profile" on public.admin_profiles
for select to authenticated using (user_id = auth.uid());
revoke all on table public.admin_profiles from anon, authenticated;
grant select on table public.admin_profiles to authenticated;

alter table public.page_views enable row level security;
revoke all on table public.page_views from anon, authenticated;
