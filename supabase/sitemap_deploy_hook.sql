-- First add a Supabase Vault secret named render_deploy_hook_url and use the
-- Render deploy hook URL as its value. Do not commit the hook URL to this file.

create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_sitemap_rebuild()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sitemap_changed boolean := false;
  deploy_hook_url text;
begin
  if tg_table_name = 'jobs' then
    if tg_op = 'INSERT' then
      sitemap_changed := new.status in ('Published', 'Open', 'Closing Soon', 'Coming Soon');
    elsif tg_op = 'UPDATE' then
      sitemap_changed := (
        old.status is distinct from new.status
        or old.slug is distinct from new.slug
        or old.updated_at is distinct from new.updated_at
      ) and (
        old.status in ('Published', 'Open', 'Closing Soon', 'Coming Soon')
        or new.status in ('Published', 'Open', 'Closing Soon', 'Coming Soon')
      );
    elsif tg_op = 'DELETE' then
      sitemap_changed := old.status in ('Published', 'Open', 'Closing Soon', 'Coming Soon');
    end if;
  elsif tg_table_name = 'blogs' then
    if tg_op = 'INSERT' then
      sitemap_changed := new.status = 'Published';
    elsif tg_op = 'UPDATE' then
      sitemap_changed := (
        old.status is distinct from new.status
        or old.slug is distinct from new.slug
        or old.updated_at is distinct from new.updated_at
      ) and (old.status = 'Published' or new.status = 'Published');
    elsif tg_op = 'DELETE' then
      sitemap_changed := old.status = 'Published';
    end if;
  end if;

  if sitemap_changed then
    select decrypted_secret
    into deploy_hook_url
    from vault.decrypted_secrets
    where name = 'render_deploy_hook_url'
    limit 1;

    if deploy_hook_url is not null and length(trim(deploy_hook_url)) > 0 then
      perform net.http_get(url := deploy_hook_url, timeout_milliseconds := 5000);
    else
      raise warning 'Render deploy hook is not configured in Supabase Vault.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.trigger_sitemap_rebuild() from public, anon, authenticated;

drop trigger if exists rebuild_sitemap_after_job_change on public.jobs;
create trigger rebuild_sitemap_after_job_change
after insert or update or delete on public.jobs
for each row execute function public.trigger_sitemap_rebuild();

drop trigger if exists rebuild_sitemap_after_blog_change on public.blogs;
create trigger rebuild_sitemap_after_blog_change
after insert or update or delete on public.blogs
for each row execute function public.trigger_sitemap_rebuild();