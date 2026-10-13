alter table public.workspaces add column if not exists onboarded boolean not null default false;
alter table public.workspaces add column if not exists brand_description text;
alter table public.workspaces add column if not exists brand_tone text;

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  kind text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;
alter table public.ai_usage enable row level security;
create policy "members read ai usage" on public.ai_usage for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members log ai usage" on public.ai_usage for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()) and user_id = auth.uid());

-- free plan: max 5 posts per month
create or replace function public.enforce_free_post_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text; n int;
begin
  select plan into p from public.workspaces where id = new.workspace_id;
  if p = 'free' then
    select count(*) into n from public.posts where workspace_id = new.workspace_id and created_at >= date_trunc('month', now());
    if n >= 5 then raise exception 'Free plan limit reached: 5 posts per month. Upgrade to Pro for unlimited posts.'; end if;
    if coalesce(array_length(new.platforms, 1), 0) > 1 then raise exception 'Free plan can post to 1 platform. Upgrade to Pro for more.'; end if;
  end if;
  return new;
end $$;
create trigger posts_free_limit before insert on public.posts for each row execute function public.enforce_free_post_limit();

-- signup: use chosen workspace name
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
  w text := nullif(trim(new.raw_user_meta_data->>'workspace_name'), '');
begin
  insert into public.profiles(id, full_name) values (new.id, n);
  insert into public.workspaces(name, owner_id) values (coalesce(w, n || '''s workspace'), new.id);
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end $$;