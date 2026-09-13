-- Schema for the badge-scan SaaS.
-- Paste into Supabase SQL editor and run once.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists badge_design jsonb;

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  barcode text not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, barcode)
);

alter table public.attendees add column if not exists company text;
alter table public.attendees add column if not exists job_title text;

alter table public.events add column if not exists start_date date;
alter table public.events add column if not exists end_date date;

-- Defensive cap on the badge_design JSONB blob so a malicious or buggy
-- client can't shove a 50 MB base64 image into our database. 2 MB is
-- plenty for a logo + background; the client form enforces 500 KB each.
alter table public.events drop constraint if exists badge_design_size_check;
alter table public.events add constraint badge_design_size_check
  check (badge_design is null or octet_length(badge_design::text) < 2 * 1024 * 1024);

-- Demo requests submitted from the public "Book a demo" form.
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  event_date date,
  expected_attendees int,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists attendees_event_barcode_idx
  on public.attendees (event_id, barcode);
create index if not exists events_owner_idx
  on public.events (owner_id);

alter table public.events enable row level security;
alter table public.attendees enable row level security;
alter table public.demo_requests enable row level security;

drop policy if exists "events_owner_select" on public.events;
drop policy if exists "events_owner_insert" on public.events;
drop policy if exists "events_owner_update" on public.events;
drop policy if exists "events_owner_delete" on public.events;

create policy "events_owner_select" on public.events
  for select using (owner_id = auth.uid());
create policy "events_owner_insert" on public.events
  for insert with check (owner_id = auth.uid());
create policy "events_owner_update" on public.events
  for update using (owner_id = auth.uid());
create policy "events_owner_delete" on public.events
  for delete using (owner_id = auth.uid());

drop policy if exists "attendees_owner_select" on public.attendees;
drop policy if exists "attendees_owner_insert" on public.attendees;
drop policy if exists "attendees_owner_update" on public.attendees;
drop policy if exists "attendees_owner_delete" on public.attendees;

create policy "attendees_owner_select" on public.attendees
  for select using (
    exists (
      select 1 from public.events e
      where e.id = attendees.event_id and e.owner_id = auth.uid()
    )
  );
create policy "attendees_owner_insert" on public.attendees
  for insert with check (
    exists (
      select 1 from public.events e
      where e.id = attendees.event_id and e.owner_id = auth.uid()
    )
  );
create policy "attendees_owner_update" on public.attendees
  for update using (
    exists (
      select 1 from public.events e
      where e.id = attendees.event_id and e.owner_id = auth.uid()
    )
  );
create policy "attendees_owner_delete" on public.attendees
  for delete using (
    exists (
      select 1 from public.events e
      where e.id = attendees.event_id and e.owner_id = auth.uid()
    )
  );

-- Anyone (including anonymous visitors) may submit a demo request.
-- No select/update/delete policy: leads are only readable via the Supabase
-- dashboard or the service role, never through the public anon key.
drop policy if exists "demo_requests_public_insert" on public.demo_requests;
create policy "demo_requests_public_insert" on public.demo_requests
  for insert to anon, authenticated with check (true);

-- ===========================================================================
-- Organizations & team invites (multi-tenant light)
-- ===========================================================================
-- Every user belongs to (at least) one organization; events belong to an
-- organization instead of a single user, so colleagues can share them. The
-- invite mechanics follow the battle-tested rules: per-email, single-use,
-- 7-day expiry, email match enforced in the database, token = capability.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_email text,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_email text not null,
  token uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

alter table public.events
  add column if not exists organization_id uuid references public.organizations(id);

-- SECURITY DEFINER so policies can call it without RLS recursion. STABLE +
-- pinned search_path per the standard hardening recipe.
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(p_org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- Backfill: give every existing user a personal organization and move their
-- events into it. Idempotent — skips users who already have a membership.
do $$
declare
  u record;
  new_org uuid;
begin
  for u in select id, email from auth.users loop
    if not exists (
      select 1 from public.organization_members m where m.user_id = u.id
    ) then
      insert into public.organizations (name)
      values (coalesce(nullif(split_part(u.email, '@', 1), ''), 'Organisatie'))
      returning id into new_org;
      insert into public.organization_members
        (organization_id, user_id, member_email, role)
      values (new_org, u.id, u.email, 'owner');
      update public.events set organization_id = new_org
      where owner_id = u.id and organization_id is null;
    end if;
  end loop;
end $$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.organization_invites to authenticated;

drop policy if exists "orgs_member_select" on public.organizations;
create policy "orgs_member_select" on public.organizations
  for select using (public.is_org_member(id));
drop policy if exists "orgs_owner_update" on public.organizations;
create policy "orgs_owner_update" on public.organizations
  for update using (public.is_org_owner(id));

drop policy if exists "org_members_member_select" on public.organization_members;
create policy "org_members_member_select" on public.organization_members
  for select using (public.is_org_member(organization_id));
-- No insert policy: memberships are created only through the SECURITY
-- DEFINER functions below. Owners can remove members; members themselves too.
drop policy if exists "org_members_owner_delete" on public.organization_members;
create policy "org_members_owner_delete" on public.organization_members
  for delete using (
    public.is_org_owner(organization_id) or user_id = auth.uid()
  );

drop policy if exists "org_invites_owner_all" on public.organization_invites;
create policy "org_invites_owner_all" on public.organization_invites
  for all using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

-- Events: organization membership replaces personal ownership as the gate.
drop policy if exists "events_owner_select" on public.events;
drop policy if exists "events_owner_insert" on public.events;
drop policy if exists "events_owner_update" on public.events;
drop policy if exists "events_owner_delete" on public.events;
drop policy if exists "events_org_select" on public.events;
drop policy if exists "events_org_insert" on public.events;
drop policy if exists "events_org_update" on public.events;
drop policy if exists "events_org_delete" on public.events;
create policy "events_org_select" on public.events
  for select using (public.is_org_member(organization_id));
create policy "events_org_insert" on public.events
  for insert with check (public.is_org_member(organization_id));
create policy "events_org_update" on public.events
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "events_org_delete" on public.events
  for delete using (public.is_org_member(organization_id));

drop policy if exists "attendees_owner_select" on public.attendees;
drop policy if exists "attendees_owner_insert" on public.attendees;
drop policy if exists "attendees_owner_update" on public.attendees;
drop policy if exists "attendees_owner_delete" on public.attendees;
drop policy if exists "attendees_org_select" on public.attendees;
drop policy if exists "attendees_org_insert" on public.attendees;
drop policy if exists "attendees_org_update" on public.attendees;
drop policy if exists "attendees_org_delete" on public.attendees;
create policy "attendees_org_select" on public.attendees
  for select using (exists (
    select 1 from public.events e
    where e.id = attendees.event_id
      and public.is_org_member(e.organization_id)
  ));
create policy "attendees_org_insert" on public.attendees
  for insert with check (exists (
    select 1 from public.events e
    where e.id = attendees.event_id
      and public.is_org_member(e.organization_id)
  ));
create policy "attendees_org_update" on public.attendees
  for update using (exists (
    select 1 from public.events e
    where e.id = attendees.event_id
      and public.is_org_member(e.organization_id)
  ));
create policy "attendees_org_delete" on public.attendees
  for delete using (exists (
    select 1 from public.events e
    where e.id = attendees.event_id
      and public.is_org_member(e.organization_id)
  ));

-- Ensures the caller has an organization; creates a personal one on first
-- use. Called on entry to authenticated pages. Returns the org id.
create or replace function public.create_own_organization()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select organization_id into v_org
  from organization_members where user_id = auth.uid()
  order by created_at limit 1;
  if found then
    return v_org;
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into organizations (name)
  values (coalesce(nullif(split_part(v_email, '@', 1), ''), 'Organisatie'))
  returning id into v_org;
  insert into organization_members (organization_id, user_id, member_email, role)
  values (v_org, auth.uid(), v_email, 'owner');
  return v_org;
end;
$$;

-- Redeems an invite token for the signed-in user. Enforces the email match
-- and expiry in the database (never trust the client), and burns the token.
create or replace function public.join_organization(p_token uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite record;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  select * into v_invite from organization_invites
  where token = p_token and is_active;
  if not found then
    raise exception 'invite_invalid';
  end if;
  if v_invite.expires_at < now() then
    update organization_invites set is_active = false where id = v_invite.id;
    raise exception 'invite_expired';
  end if;
  if lower(v_invite.invited_email) <> lower(v_email) then
    raise exception 'email_mismatch';
  end if;
  insert into organization_members (organization_id, user_id, member_email, role)
  values (v_invite.organization_id, auth.uid(), v_email, 'member')
  on conflict (organization_id, user_id) do nothing;
  update organization_invites set is_active = false where id = v_invite.id;
  return v_invite.organization_id;
end;
$$;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;
grant execute on function public.create_own_organization() to authenticated;
grant execute on function public.join_organization(uuid) to authenticated;

create index if not exists org_members_user_idx
  on public.organization_members (user_id);
create index if not exists org_invites_org_idx
  on public.organization_invites (organization_id);
create index if not exists events_org_idx
  on public.events (organization_id);
