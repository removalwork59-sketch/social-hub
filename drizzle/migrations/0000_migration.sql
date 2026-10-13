create type public.workspace_role as enum ('owner','admin','member');
create type public.social_platform as enum ('facebook','instagram','linkedin','twitter','google_business');
create type public.post_status as enum ('draft','scheduled','published','failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  plan text not null default 'free',
  logo_url text,
  brand_color text,
  custom_domain text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
grant select, insert, update, delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;

create or replace function public.is_workspace_member(_ws uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.workspace_members where workspace_id = _ws and user_id = _user)
$$;
create or replace function public.is_workspace_admin(_ws uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.workspace_members where workspace_id = _ws and user_id = _user and role in ('owner','admin'))
$$;

alter table public.workspaces enable row level security;
create policy "members read ws" on public.workspaces for select to authenticated using (public.is_workspace_member(id, auth.uid()) or owner_id = auth.uid());
create policy "create own ws" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "admins update ws" on public.workspaces for update to authenticated using (public.is_workspace_admin(id, auth.uid()));
create policy "owner delete ws" on public.workspaces for delete to authenticated using (owner_id = auth.uid());

alter table public.workspace_members enable row level security;
create policy "members read members" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "admins manage members" on public.workspace_members for all to authenticated using (public.is_workspace_admin(workspace_id, auth.uid())) with check (public.is_workspace_admin(workspace_id, auth.uid()));

-- auto add creator as owner
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members(workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger on_workspace_created after insert on public.workspaces for each row execute function public.handle_new_workspace();

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform public.social_platform not null,
  handle text not null,
  status text not null default 'connected',
  connected_at timestamptz not null default now()
);
grant select, insert, update, delete on public.social_accounts to authenticated;
grant all on public.social_accounts to service_role;
alter table public.social_accounts enable row level security;
create policy "members read accounts" on public.social_accounts for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "admins manage accounts" on public.social_accounts for all to authenticated using (public.is_workspace_admin(workspace_id, auth.uid())) with check (public.is_workspace_admin(workspace_id, auth.uid()));

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  content text not null,
  platforms public.social_platform[] not null default '{}',
  scheduled_at timestamptz,
  status public.post_status not null default 'scheduled',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "members read posts" on public.posts for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members create posts" on public.posts for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()) and created_by = auth.uid());
create policy "members update posts" on public.posts for update to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members delete posts" on public.posts for delete to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));

-- signup: profile + first workspace
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
begin
  insert into public.profiles(id, full_name) values (new.id, n);
  insert into public.workspaces(name, owner_id) values (n || '''s workspace', new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();