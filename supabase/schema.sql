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

create index if not exists attendees_event_barcode_idx
  on public.attendees (event_id, barcode);
create index if not exists events_owner_idx
  on public.events (owner_id);

alter table public.events enable row level security;
alter table public.attendees enable row level security;

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
