-- Migration 3: ticket tiers (one or more per event)

create table public.ticket_tiers (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(10, 2) not null default 0 check (price >= 0),
  capacity     int check (capacity is null or capacity > 0),   -- null = unlimited
  sales_start  timestamptz,
  sales_end    timestamptz,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  -- Lets registrations check that a tier belongs to the same event.
  constraint ticket_tiers_id_event_key unique (id, event_id),
  constraint ticket_tiers_sales_window check (
    sales_start is null or sales_end is null or sales_end > sales_start
  )
);

create index ticket_tiers_event_id_idx on public.ticket_tiers (event_id);

alter table public.ticket_tiers enable row level security;

-- Anyone sees the tiers of events they are allowed to see (the events
-- policies apply inside this check, so drafts stay hidden).
create policy "ticket_tiers: read tiers of visible events"
  on public.ticket_tiers for select
  to anon, authenticated
  using (exists (select 1 from public.events e where e.id = event_id));

create policy "ticket_tiers: owner insert"
  on public.ticket_tiers for insert
  to authenticated
  with check (public.owns_event(event_id) or public.is_admin());

create policy "ticket_tiers: owner update"
  on public.ticket_tiers for update
  to authenticated
  using (public.owns_event(event_id) or public.is_admin())
  with check (public.owns_event(event_id) or public.is_admin());

create policy "ticket_tiers: owner delete"
  on public.ticket_tiers for delete
  to authenticated
  using (public.owns_event(event_id) or public.is_admin());

-- An event needs at least one active tier before it can be published.
create or replace function public.require_tier_to_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not exists (
       select 1 from public.ticket_tiers
       where event_id = new.id and is_active
     ) then
    raise exception 'Add at least one active ticket tier before publishing';
  end if;
  return new;
end;
$$;

create trigger events_require_tier_to_publish
  before insert or update of status on public.events
  for each row execute function public.require_tier_to_publish();

revoke execute on function public.require_tier_to_publish() from public, anon, authenticated;
