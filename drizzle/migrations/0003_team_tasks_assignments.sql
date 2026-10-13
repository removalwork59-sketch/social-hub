alter type public.post_status add value if not exists 'pending_approval';

alter table public.inbox_messages add column if not exists assigned_to uuid;
alter table public.inbox_messages add column if not exists is_read boolean not null default false;
alter table public.inbox_messages add column if not exists archived boolean not null default false;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  assigned_to uuid,
  due_date date,
  status text not null default 'todo',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "members read tasks" on public.tasks for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "admins create tasks" on public.tasks for insert to authenticated with check (public.is_workspace_admin(workspace_id, auth.uid()));
create policy "members update tasks" on public.tasks for update to authenticated using (public.is_workspace_admin(workspace_id, auth.uid()) or assigned_to = auth.uid());
create policy "admins delete tasks" on public.tasks for delete to authenticated using (public.is_workspace_admin(workspace_id, auth.uid()));

-- members of a workspace can see each other's names
create policy "co-members read profiles" on public.profiles for select to authenticated using (
  exists (select 1 from public.workspace_members a join public.workspace_members b on a.workspace_id = b.workspace_id
          where a.user_id = auth.uid() and b.user_id = profiles.id)
);

-- add an existing user to a workspace by email (admins only)
create or replace function public.add_workspace_member(_ws uuid, _email text, _role public.workspace_role)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_workspace_admin(_ws, auth.uid()) then raise exception 'forbidden'; end if;
  select id into uid from auth.users where lower(email) = lower(_email);
  if uid is null then return 'not_found'; end if;
  insert into public.workspace_members(workspace_id, user_id, role) values (_ws, uid, _role)
  on conflict (workspace_id, user_id) do update set role = excluded.role;
  return 'ok';
end $$;