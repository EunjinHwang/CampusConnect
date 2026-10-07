-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  role text not null default 'student' check (role in ('student','organizer','admin'))
);

create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references profiles(id) not null,
  title text not null,
  description text,
  category text,
  location text,
  starts_at timestamptz not null,
  capacity int,
  image_url text,
  created_at timestamptz default now()
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  attended boolean default false,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  status text default 'placed' check (status in ('placed','completed','cancelled')),
  total numeric(10,2),
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null,
  unit_price numeric(10,2) not null
);

alter table profiles enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create function is_role(r text[]) returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = any(r));
$$ language sql security definer;

create policy "프로필 본인 조회" on profiles for select using (id = auth.uid() or is_role(array['admin']));
create policy "이벤트 누구나 조회" on events for select using (true);
create policy "주최자 이벤트 생성" on events for insert with check (is_role(array['organizer','admin']) and organizer_id = auth.uid());
create policy "주최자 본인 이벤트 수정" on events for update using (organizer_id = auth.uid() or is_role(array['admin']));
create policy "주최자 본인 이벤트 삭제" on events for delete using (organizer_id = auth.uid() or is_role(array['admin']));

create policy "본인 등록 조회" on registrations for select
  using (user_id = auth.uid() or exists (select 1 from events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "본인 등록" on registrations for insert with check (user_id = auth.uid());
create policy "본인 등록 취소" on registrations for delete using (user_id = auth.uid());
create policy "주최자 출석 처리" on registrations for update
  using (exists (select 1 from events e where e.id = event_id and e.organizer_id = auth.uid()));

create policy "상품 누구나 조회" on products for select using (true);
create policy "관리자 상품 관리" on products for all using (is_role(array['admin'])) with check (is_role(array['admin']));

create policy "본인 주문 조회" on orders for select using (user_id = auth.uid() or is_role(array['admin']));
create policy "본인 주문 생성" on orders for insert with check (user_id = auth.uid());
create policy "관리자 주문 수정" on orders for update using (is_role(array['admin']));
create policy "본인 주문상품 조회" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_role(array['admin']))));
create policy "본인 주문상품 생성" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
