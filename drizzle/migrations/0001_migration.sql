create type public.inbox_kind as enum ('comment','dm','mention','review');
create type public.inbox_status as enum ('open','resolved');

create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform public.social_platform not null,
  kind public.inbox_kind not null default 'comment',
  author text not null,
  content text not null,
  sentiment text not null default 'neutral',
  status public.inbox_status not null default 'open',
  is_sample boolean not null default false,
  received_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select, insert, update, delete on public.inbox_messages to authenticated;
grant all on public.inbox_messages to service_role;
alter table public.inbox_messages enable row level security;
create policy "members read inbox" on public.inbox_messages for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members update inbox" on public.inbox_messages for update to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create index on public.inbox_messages (workspace_id, received_at desc);

create or replace function public.seed_sample_inbox(_ws uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.inbox_messages (workspace_id, platform, kind, author, content, sentiment, is_sample, received_at) values
  (_ws,'instagram','comment','john_doe','Love this! Is the festive offer valid in stores too?','positive',true, now() - interval '2 minutes'),
  (_ws,'facebook','dm','priya.s','My order #4821 hasn''t arrived yet, can you check?','negative',true, now() - interval '40 minutes'),
  (_ws,'twitter','mention','techdaily','Big fan of how @brand handles support. Fast replies every time.','positive',true, now() - interval '3 hours'),
  (_ws,'google_business','review','Ramesh K','Good coffee, but the wait time was a bit long on Sunday.','neutral',true, now() - interval '6 hours'),
  (_ws,'linkedin','comment','arjun_m','Are you hiring for remote roles as well?','neutral',true, now() - interval '1 day'),
  (_ws,'instagram','dm','neha.k','Do you ship to Pune? Want to order for a gift.','positive',true, now() - interval '2 days');
$$;

select public.seed_sample_inbox(id) from public.workspaces;

create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members(workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  perform public.seed_sample_inbox(new.id);
  return new;
end $$;
revoke execute on function public.seed_sample_inbox(uuid) from public, anon, authenticated;