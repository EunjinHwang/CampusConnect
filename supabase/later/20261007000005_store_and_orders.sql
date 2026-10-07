-- Migration 5: store products, orders and order items
-- Orders and order items are written only by the functions below, never
-- directly from the app, so prices and totals can't be tampered with.

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events (id) on delete restrict,  -- null = CampusConnect merch
  name          text not null,
  description   text,
  price         numeric(10, 2) not null check (price >= 0),
  stock         int check (stock is null or stock >= 0),                 -- null = unlimited
  image_url     text,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index products_event_id_idx on public.products (event_id);

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles (id) on delete set null,
  status            text not null default 'pending'
                    check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  subtotal          numeric(10, 2) not null default 0 check (subtotal >= 0),
  total             numeric(10, 2) not null default 0 check (total >= 0),
  currency          text not null default 'usd',   -- change to your currency
  payment_provider  text,
  payment_ref       text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_created_idx on public.orders (status, created_at);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete restrict,
  tier_id     uuid references public.ticket_tiers (id) on delete restrict,
  item_name   text not null,                                    -- copied at purchase
  quantity    int not null check (quantity > 0),
  unit_price  numeric(10, 2) not null check (unit_price >= 0),  -- copied at purchase
  constraint order_items_one_kind check ((product_id is null) <> (tier_id is null))
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_items_tier_id_idx on public.order_items (tier_id);

-- Link paid registrations to their order (column created in migration 4).
alter table public.registrations
  add constraint registrations_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete set null;

create index registrations_order_id_idx on public.registrations (order_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- products policies
create policy "products: read available merch and visible event items"
  on public.products for select
  to anon, authenticated
  using (
    (is_available and (
      event_id is null
      or exists (select 1 from public.events e where e.id = event_id)
    ))
    or public.is_admin()
    or (event_id is not null and public.owns_event(event_id))
  );

create policy "products: admin or event owner insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin() or (event_id is not null and public.owns_event(event_id)));

create policy "products: admin or event owner update"
  on public.products for update
  to authenticated
  using (public.is_admin() or (event_id is not null and public.owns_event(event_id)))
  with check (public.is_admin() or (event_id is not null and public.owns_event(event_id)));

create policy "products: admin or event owner delete"
  on public.products for delete
  to authenticated
  using (public.is_admin() or (event_id is not null and public.owns_event(event_id)));

-- orders policies
create policy "orders: read own"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "orders: admin update"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items policies
create policy "order_items: read own, event owner, admin"
  on public.order_items for select
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.event_id is not null and public.owns_event(p.event_id)
    )
    or exists (
      select 1 from public.ticket_tiers t
      where t.id = tier_id and public.owns_event(t.event_id)
    )
  );

-- Organizers can also read the profiles of people who bought their items.
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
  )
  or exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    join public.products p on p.id = oi.product_id
    join public.events e on e.id = p.event_id
    where o.user_id = p_profile_id
      and e.organizer_id = auth.uid()
  );
$$;

-- Checkout. p_items is a JSON array such as
--   [{"product_id": "...", "quantity": 2}, {"tier_id": "...", "quantity": 1}]
-- Prices come from the database, never from the browser. Stock is reserved
-- now and returned if the order is cancelled, expires or is refunded.
create or replace function public.checkout(p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_order_id uuid;
  v_item     jsonb;
  v_qty      int;
  v_product  public.products;
  v_tier     public.ticket_tiers;
  v_subtotal numeric(10, 2) := 0;
begin
  if v_user is null then
    raise exception 'Sign in to check out';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The cart is empty';
  end if;

  insert into public.orders (user_id) values (v_user) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 1);
    if v_qty <= 0 then
      raise exception 'Quantity must be above 0';
    end if;

    if v_item ? 'product_id' then
      select * into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid
      for update;

      if not found or not v_product.is_available
         or (v_product.event_id is not null and not exists (
               select 1 from public.events e
               where e.id = v_product.event_id and e.status = 'published')) then
        raise exception 'A product in your cart is no longer available';
      end if;
      if v_product.stock is not null and v_product.stock < v_qty then
        raise exception 'Not enough stock for %', v_product.name;
      end if;

      update public.products
      set stock = stock - v_qty
      where id = v_product.id and stock is not null;

      insert into public.order_items (order_id, product_id, item_name, quantity, unit_price)
      values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);

      v_subtotal := v_subtotal + v_product.price * v_qty;

    elsif v_item ? 'tier_id' then
      if v_qty <> 1 then
        raise exception 'Only one ticket per person per event';
      end if;

      -- Checked first so the message is right even when the tier is full.
      if exists (
        select 1 from public.registrations r
        join public.ticket_tiers t on t.event_id = r.event_id
        where t.id = (v_item ->> 'tier_id')::uuid and r.user_id = v_user and r.status <> 'cancelled'
      ) then
        raise exception 'You are already registered for this event';
      end if;
      v_tier := public.lock_available_tier((v_item ->> 'tier_id')::uuid);
      if v_tier.price = 0 then
        raise exception 'Free tiers don''t need checkout; register directly';
      end if;

      insert into public.registrations (event_id, tier_id, user_id, order_id, status)
      values (v_tier.event_id, v_tier.id, v_user, v_order_id, 'pending');

      insert into public.order_items (order_id, tier_id, item_name, quantity, unit_price)
      values (v_order_id, v_tier.id, v_tier.name, 1, v_tier.price);

      v_subtotal := v_subtotal + v_tier.price;

    else
      raise exception 'Each cart item needs a product_id or a tier_id';
    end if;
  end loop;

  update public.orders
  set subtotal = v_subtotal, total = v_subtotal
  where id = v_order_id;

  return v_order_id;
exception
  when unique_violation then
    raise exception 'You are already registered for one of these events';
end;
$$;

-- Internal: close an order and give back what it held (stock and seats).
create or replace function public.release_order(p_order_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products p
  set stock = p.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.product_id = p.id
    and p.stock is not null;

  update public.registrations
  set status = 'cancelled'
  where order_id = p_order_id and status <> 'cancelled';

  update public.orders
  set status = p_new_status
  where id = p_order_id;
end;
$$;

-- The buyer (or an admin) cancels an order that hasn't been paid yet.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or (v_order.user_id is distinct from auth.uid() and not public.is_admin()) then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only unpaid orders can be cancelled; paid orders are refunded';
  end if;

  perform public.release_order(p_order_id, 'cancelled');
end;
$$;

-- Admin refunds a paid order. Its tickets are cancelled and stock returns.
-- (Send the money back in the payment service too.)
create or replace function public.refund_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can refund orders';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status not in ('paid', 'fulfilled') then
    raise exception 'Only paid orders can be refunded';
  end if;

  perform public.release_order(p_order_id, 'refunded');
end;
$$;

-- Called by the payment Edge Function (service role only) once the
-- payment service confirms the money arrived.
create or replace function public.confirm_payment(p_order_id uuid, p_provider text, p_payment_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Order % is %, not pending', p_order_id, v_order.status;
  end if;

  update public.orders
  set status = 'paid',
      paid_at = now(),
      payment_provider = p_provider,
      payment_ref = p_payment_ref
  where id = p_order_id;

  update public.registrations
  set status = 'confirmed'
  where order_id = p_order_id and status = 'pending';
end;
$$;

revoke execute on function public.release_order(uuid, text) from public, anon, authenticated;
revoke execute on function public.confirm_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, text, text) to service_role;
revoke execute on function public.checkout(jsonb) from public, anon;
revoke execute on function public.cancel_order(uuid) from public, anon;
revoke execute on function public.refund_order(uuid) from public, anon;
grant execute on function public.checkout(jsonb) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.refund_order(uuid) to authenticated;

-- Table access (RLS above still decides which rows each person sees;
-- orders and order items are written only by the functions above).
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant all on public.products, public.orders, public.order_items to service_role;
