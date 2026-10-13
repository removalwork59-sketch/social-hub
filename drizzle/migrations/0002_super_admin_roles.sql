create type public.app_role as enum ('super_admin','partner','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- platform-wide stats, super admin only
create or replace function public.admin_platform_stats()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'super_admin') then raise exception 'forbidden'; end if;
  return json_build_object(
    'clients', (select count(*) from public.workspaces),
    'users', (select count(*) from public.profiles),
    'posts', (select count(*) from public.posts),
    'published', (select count(*) from public.posts where status = 'published'),
    'accounts', (select count(*) from public.social_accounts),
    'open_messages', (select count(*) from public.inbox_messages where status = 'open')
  );
end $$;

create or replace function public.admin_list_workspaces()
returns table (id uuid, name text, plan text, created_at timestamptz, posts bigint, accounts bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'super_admin') then raise exception 'forbidden'; end if;
  return query select w.id, w.name, w.plan, w.created_at,
    (select count(*) from public.posts p where p.workspace_id = w.id),
    (select count(*) from public.social_accounts a where a.workspace_id = w.id)
  from public.workspaces w order by w.created_at desc;
end $$;

-- first ever user becomes the platform owner
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
begin
  insert into public.profiles(id, full_name) values (new.id, n);
  insert into public.workspaces(name, owner_id) values (n || '''s workspace', new.id);
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end $$;