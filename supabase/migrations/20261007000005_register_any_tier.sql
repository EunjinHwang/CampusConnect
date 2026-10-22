-- Migration 5: register for any tier (free or paid) without payment
-- Payments aren't built yet, so for now anyone can take a seat in a paid
-- tier straight away. Once checkout and payments are ready, a later
-- migration makes this function refuse paid tiers again, so they go
-- through checkout instead.

create or replace function public.register_for_tier(p_tier_id uuid)
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

  -- Locks the tier and checks it is active, on sale, and not sold out.
  v_tier := public.lock_available_tier(p_tier_id);

  insert into public.registrations (event_id, tier_id, user_id, status)
  values (v_tier.event_id, v_tier.id, v_user, 'confirmed')
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'You are already registered for this event';
end;
$$;

revoke execute on function public.register_for_tier(uuid) from public, anon;
grant execute on function public.register_for_tier(uuid) to authenticated;
