-- Migration 2: organizer profiles and events

-- Fix for migration 1: newer Supabase projects don't grant table access
-- automatically, so the app got "permission denied for table profiles".
-- (Already in migration 1 for fresh setups; repeating it is harmless.)
grant select, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_role(text[]) to anon, authenticated;

create table public.organizer_profiles (
  profile_id     uuid primary key references public.profiles (id) on delete cascade,
  display_name   text not null,
  bio            text,
  logo_url       text,
  contact_email  text,
  website_url    text,
  created_at     timestamptz not null default now()
);

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete restrict,
  title         text not null,
  description   text,
  category      text check (category in ('Academic', 'Clubs', 'Sports', 'Culture', 'Career')),
  location      text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  image_url     text,
  status        text not null default 'draft'
                check (status in ('draft', 'published', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_ends_after_start check (ends_at is null or ends_at > starts_at)
);

create index events_organizer_id_idx on public.events (organizer_id);
create index events_starts_at_idx on public.events (starts_at);

alter table public.organizer_profiles enable row level security;
alter table public.events enable row level security;

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Helper: is the signed-in person the organizer of this event?
create or replace function public.owns_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and organizer_id = auth.uid()
  );
$$;

-- organizer_profiles policies
create policy "organizer_profiles: public read"
  on public.organizer_profiles for select
  to anon, authenticated
  using (true);

create policy "organizer_profiles: organizer creates own"
  on public.organizer_profiles for insert
  to authenticated
  with check (
    (profile_id = (select auth.uid()) and public.has_role(array['organizer', 'admin']))
    or public.is_admin()
  );

create policy "organizer_profiles: owner or admin update"
  on public.organizer_profiles for update
  to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin())
  with check (profile_id = (select auth.uid()) or public.is_admin());

create policy "organizer_profiles: owner or admin delete"
  on public.organizer_profiles for delete
  to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());

-- events policies
create policy "events: public read published, owner reads own"
  on public.events for select
  to anon, authenticated
  using (
    status in ('published', 'cancelled')
    or organizer_id = (select auth.uid())
    or public.is_admin()
  );

create policy "events: organizer insert"
  on public.events for insert
  to authenticated
  with check (
    (organizer_id = (select auth.uid()) and public.has_role(array['organizer', 'admin']))
    or public.is_admin()
  );

create policy "events: owner update"
  on public.events for update
  to authenticated
  using (organizer_id = (select auth.uid()) or public.is_admin())
  with check (organizer_id = (select auth.uid()) or public.is_admin());

-- Deleting an event with registrations or sales is blocked by foreign keys
-- added in later migrations; cancel it instead (status = 'cancelled').
create policy "events: owner delete"
  on public.events for delete
  to authenticated
  using (organizer_id = (select auth.uid()) or public.is_admin());

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Table access (RLS above still decides which rows each person sees).
grant select on public.organizer_profiles, public.events to anon, authenticated;
grant insert, update, delete on public.organizer_profiles, public.events to authenticated;
grant all on public.organizer_profiles, public.events to service_role;
grant execute on function public.owns_event(uuid) to anon, authenticated;
