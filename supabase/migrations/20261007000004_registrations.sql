-- Migration 4: registrations
-- Nobody writes this table directly from the app. Registering, cancelling
-- and marking attendance go through the functions at the bottom.

create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete restrict,
  tier_id     uuid not null,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  order_id    uuid,   -- linked to orders in migration 5; set only for paid tiers
  status      text not null default 'pending'
              check (status in ('pending', 'confirmed', 'cancelled')),
  attended    boolean not null default false,
  created_at  timestamptz not null default now(),
  -- The tier must belong to the same event.
  constraint registrations_tier_event_fkey
    foreign key (tier_id, event_id)
    references public.ticket_tiers (id, event_id)
    on delete restrict
);

-- One active registration per user per event; cancelled rows don't count,
-- so someone who cancels can register again.
create unique index registrations_one_active_per_user
  on public.registrations (event_id, user_id)
  where status <> 'cancelled';

create index registrations_user_id_idx on public.registrations (user_id);
create index registrations_tier_id_idx on public.registrations (tier_id);

alter table public.registrations enable row level security;

create policy "registrations: read own, event owner, admin"
  on public.registrations for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_event(event_id)
    or public.is_admin()
  );

create policy "registrations: admin all"
  on public.registrations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Organizers can read the profiles of people registered for their events
-- (for attendee lists). Migration 5 extends this to buyers.
create or replace function public.organizer_can_see_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.registrations r
    join public.events e on e.id = r.event_id
    where r.user_id = p_profile_id
      and e.organizer_id = auth.uid()
  );
$$;

create policy "profiles: organizer reads attendees"
  on public.profiles for select
  to authenticated
  using (public.organizer_can_see_profile(id));

-- Shared check for registering and checkout: locks the tier row (so two
-- people can't take the last seat at once) and raises a clear error if
-- the tier can't be sold right now.
create or replace function public.lock_available_tier(p_tier_id uuid)
returns public.ticket_tiers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier  public.ticket_tiers;
  v_event public.events;
  v_taken int;
begin
  select * into v_tier from public.ticket_tiers where id = p_tier_id for update;
  if not found or not v_tier.is_active then
    raise exception 'This ticket tier is not available';
  end if;

  select * into v_event from public.events where id = v_tier.event_id;
  if v_event.status <> 'published'
     or coalesce(v_event.ends_at, v_event.starts_at) < now() then
    raise exception 'This event is not open for registration';
  end if;

  if (v_tier.sales_start is not null and now() < v_tier.sales_start)
     or (v_tier.sales_end is not null and now() > v_tier.sales_end) then
    raise exception 'Tickets for this tier are not on sale right now';
  end if;

  if v_tier.capacity is not null then
    select count(*) into v_taken
    from public.registrations
    where tier_id = v_tier.id and status <> 'cancelled';
    if v_taken >= v_tier.capacity then
      raise exception 'This ticket tier is sold out';
    end if;
  end if;

  return v_tier;
end;
$$;

-- Register the signed-in user for a free tier. Paid tiers use checkout.
create or replace function public.register_for_free_tier(p_tier_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tier public.ticket_tiers;
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'Sign in to register';
  end if;

  -- Checked first so the message is right even when the tier is full.
  if exists (
    select 1 from public.registrations r
    join public.ticket_tiers t on t.event_id = r.event_id
    where t.id = p_tier_id and r.user_id = v_user and r.status <> 'cancelled'
  ) then
    raise exception 'You are already registered for this event';
  end if;
  v_tier := public.lock_available_tier(p_tier_id);
  if v_tier.price > 0 then
    raise exception 'This tier is paid; register through checkout';
  end if;

  insert into public.registrations (event_id, tier_id, user_id, status)
  values (v_tier.event_id, v_tier.id, v_user, 'confirmed')
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'You are already registered for this event';
end;
$$;

-- Cancel your own free registration. Paid tickets are cancelled by
-- cancelling or refunding their order (migration 5).
create or replace function public.cancel_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg public.registrations;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or (v_reg.user_id <> auth.uid() and not public.is_admin()) then
    raise exception 'Registration not found';
  end if;
  if v_reg.order_id is not null then
    raise exception 'This ticket was paid for; cancel or refund its order instead';
  end if;

  update public.registrations
  set status = 'cancelled'
  where id = p_registration_id;
end;
$$;

-- The event's organizer marks someone as attended (or not).
create or replace function public.set_attendance(p_registration_id uuid, p_attended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg public.registrations;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or not (public.owns_event(v_reg.event_id) or public.is_admin()) then
    raise exception 'Registration not found';
  end if;
  if v_reg.status <> 'confirmed' then
    raise exception 'Only confirmed registrations can be checked in';
  end if;

  update public.registrations
  set attended = p_attended
  where id = p_registration_id;
end;
$$;

-- Only signed-in users may call the app-facing functions.
revoke execute on function public.lock_available_tier(uuid) from public, anon, authenticated;
revoke execute on function public.register_for_free_tier(uuid) from public, anon;
revoke execute on function public.cancel_registration(uuid) from public, anon;
revoke execute on function public.set_attendance(uuid, boolean) from public, anon;
grant execute on function public.register_for_free_tier(uuid) to authenticated;
grant execute on function public.cancel_registration(uuid) to authenticated;
grant execute on function public.set_attendance(uuid, boolean) to authenticated;

-- Table access. Users only read; writes go through the functions above
-- (the admin policy still allows admins to edit rows directly).
grant select, insert, update, delete on public.registrations to authenticated;
grant all on public.registrations to service_role;
grant execute on function public.organizer_can_see_profile(uuid) to authenticated;
