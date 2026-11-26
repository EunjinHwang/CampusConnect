-- CampusConnect - Sprint 5
-- Merchandise orders and secure checkout
-- Preserves existing products and registration tables

begin;

-- Step 1: Store customer orders.
create table public.orders (
    id uuid primary key default gen_random_uuid(),

    user_id uuid references public.profiles(id)
        on delete set null,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'paid',
                'shipped',
                'completed',
                'cancelled',
                'refunded'
            )
        ),

    subtotal numeric(10, 2) not null default 0
        check (subtotal >= 0),

    total numeric(10, 2) not null default 0
        check (total >= 0),

    currency text not null default 'cad',

    payment_provider text,
    payment_ref text,

    created_at timestamptz not null default now(),
    paid_at timestamptz
);


-- Step 2: Store individual merchandise order items.
create table public.order_items (
    id uuid primary key default gen_random_uuid(),

    order_id uuid not null
        references public.orders(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id)
        on delete restrict,

    item_name text not null,

    quantity integer not null
        check (quantity > 0),

    unit_price numeric(10, 2) not null
        check (unit_price >= 0),

    unique (order_id, product_id)
);


-- Step 3: Improve order lookup performance.
create index orders_user_id_idx
    on public.orders(user_id);

create index orders_status_created_idx
    on public.orders(status, created_at);

create index order_items_product_id_idx
    on public.order_items(product_id);


-- Step 4: Enable row-level security.
alter table public.orders
    enable row level security;

alter table public.order_items
    enable row level security;


-- Customers can view their own orders.
-- Administrators can view all orders.
create policy "orders_read_own_or_admin"
    on public.orders
    for select
    to authenticated
    using (
        user_id = (select auth.uid())
        or public.is_admin()
    );


-- Customers can view items belonging to their orders.
create policy "order_items_read_own_or_admin"
    on public.order_items
    for select
    to authenticated
    using (
        public.is_admin()
        or exists (
            select 1
            from public.orders o
            where o.id = order_items.order_id
            and o.user_id = (select auth.uid())
        )
    );


-- Step 5: Create merchandise orders securely.
-- Prices and stock are verified inside the database.
create function public.checkout(p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user uuid := auth.uid();
    v_order_id uuid;
    v_item jsonb;
    v_qty integer;
    v_product public.products;
    v_subtotal numeric(10, 2) := 0;
begin

    -- Require an authenticated customer.
    if v_user is null then
        raise exception 'Sign in to check out';
    end if;

    -- Validate the cart structure.
    if p_items is null
        or jsonb_typeof(p_items) <> 'array'
    then
        raise exception 'Invalid cart';
    end if;

    if jsonb_array_length(p_items) = 0 then
        raise exception 'Your shopping cart is empty';
    end if;

    -- Create the pending demonstration order.
    insert into public.orders (
        user_id,
        currency,
        payment_provider
    )
    values (
        v_user,
        'cad',
        'demo'
    )
    returning id into v_order_id;

    -- Process merchandise in consistent product order.
    for v_item in
        select value
        from jsonb_array_elements(p_items)
        order by (value ->> 'product_id')::uuid
    loop

        -- Validate the product and quantity.
        if not (v_item ? 'product_id') then
            raise exception 'Product ID is required';
        end if;

        v_qty := (v_item ->> 'quantity')::integer;

        if v_qty is null or v_qty <= 0 then
            raise exception 'Invalid product quantity';
        end if;

        -- Prevent duplicate products in the same order.
        if exists (
            select 1
            from public.order_items
            where order_id = v_order_id
            and product_id =
                (v_item ->> 'product_id')::uuid
        ) then
            raise exception 'Duplicate product in cart';
        end if;

        -- Lock the product while checking stock.
        select *
        into v_product
        from public.products
        where id = (v_item ->> 'product_id')::uuid
        for update;

        -- Verify product availability.
        if not found
            or v_product.is_active is not true
        then
            raise exception
                'A product in your cart is unavailable';
        end if;

        -- Verify available inventory.
        if v_product.stock < v_qty then
            raise exception
                'Not enough stock for %',
                v_product.name;
        end if;

        -- Verify that the displayed price has not changed.
        if (v_item ->> 'expected_price')::numeric
            is distinct from v_product.price
        then
            raise exception
                'The price of % has changed',
                v_product.name;
        end if;

        -- Reserve the purchased quantity.
        update public.products
        set stock = stock - v_qty
        where id = v_product.id;

        -- Save the product name and authoritative price.
        insert into public.order_items (
            order_id,
            product_id,
            item_name,
            quantity,
            unit_price
        )
        values (
            v_order_id,
            v_product.id,
            v_product.name,
            v_qty,
            v_product.price
        );

        -- Calculate the order subtotal.
        v_subtotal :=
            v_subtotal + v_product.price * v_qty;

    end loop;

    -- Save the final order totals.
    update public.orders
    set
        subtotal = v_subtotal,
        total = v_subtotal
    where id = v_order_id;

    return v_order_id;

end;
$$;


-- Step 6: Restrict direct access to order tables.
revoke all on public.orders
    from public, anon, authenticated;

revoke all on public.order_items
    from public, anon, authenticated;

grant select on public.orders
    to authenticated;

grant select on public.order_items
    to authenticated;

grant all on public.orders, public.order_items
    to service_role;


-- Step 7: Only authenticated users can execute checkout.
revoke execute on function public.checkout(jsonb)
    from public, anon, authenticated;

grant execute on function public.checkout(jsonb)
    to authenticated;


-- Step 8: Cancel pending orders and restore product stock.
create function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user uuid := auth.uid();
    v_order public.orders;
begin

    -- Require an authenticated user.
    if v_user is null then
        raise exception 'Sign in to cancel an order';
    end if;

    -- Lock the order to prevent duplicate cancellations.
    select *
    into v_order
    from public.orders
    where id = p_order_id
    for update;

    -- Verify that the order exists.
    if not found then
        raise exception 'Order not found';
    end if;

    -- Only the customer or an administrator can cancel.
    if v_order.user_id is distinct from v_user
        and public.is_admin() is not true
    then
        raise exception 'Order not found';
    end if;

    -- Only pending orders can be cancelled.
    if v_order.status <> 'pending' then
        raise exception
            'Only pending orders can be cancelled';
    end if;

    -- Lock products in consistent order.
    perform p.id
    from public.products p
    join public.order_items oi
        on oi.product_id = p.id
    where oi.order_id = p_order_id
    order by p.id
    for update of p;

    -- Restore merchandise stock.
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
        and oi.product_id = p.id;

    -- Mark the order as cancelled.
    update public.orders
    set status = 'cancelled'
    where id = p_order_id;

end;
$$;


-- Step 9: Manage merchandise order statuses.
create function public.update_order_status(
    p_order_id uuid,
    p_new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_order public.orders;
begin

    -- Restrict status management to administrators.
    if auth.uid() is null
        or public.is_admin() is not true
    then
        raise exception 'Administrator access required';
    end if;

    -- Lock the selected order.
    select *
    into v_order
    from public.orders
    where id = p_order_id
    for update;

    -- Verify that the order exists.
    if not found then
        raise exception 'Order not found';
    end if;

    -- Validate the requested status.
    if p_new_status is null
        or p_new_status not in (
            'shipped',
            'completed',
            'cancelled'
        )
    then
        raise exception 'Invalid order status';
    end if;

    -- Cancel pending orders and restore stock.
    if p_new_status = 'cancelled' then
        perform public.cancel_order(p_order_id);
        return;
    end if;

    -- Validate the order status transition.
    if (
        (
            v_order.status = 'pending'
            and v_order.payment_provider = 'demo'
            and p_new_status = 'shipped'
        )
        or
        (
            v_order.status = 'paid'
            and p_new_status = 'shipped'
        )
        or
        (
            v_order.status = 'shipped'
            and p_new_status = 'completed'
        )
    ) is not true
    then
        raise exception
            'Cannot change order status from % to %',
            v_order.status,
            p_new_status;
    end if;

    -- Save the new order status.
    update public.orders
    set status = p_new_status
    where id = p_order_id;

end;
$$;


-- Step 10: Secure order management functions.
revoke execute
on function public.cancel_order(uuid)
from public, anon, authenticated;

grant execute
on function public.cancel_order(uuid)
to authenticated;

revoke execute
on function public.update_order_status(uuid, text)
from public, anon, authenticated;

grant execute
on function public.update_order_status(uuid, text)
to authenticated;


-- Complete the database migration.
commit;