-- TradeGrid MVP schema

create table users (
  id uuid primary key,
  role text not null check (role in ('seller','buyer','transporter','admin')),
  full_name text not null,
  phone text not null unique,
  town text,
  region text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table listings (
  id uuid primary key,
  seller_id uuid not null references users(id),
  title text not null,
  category text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  price numeric(12,2) not null,
  currency text not null default 'NGN',
  town text,
  region text,
  delivery_available boolean not null default false,
  pickup_available boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key,
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  quantity numeric(12,2) not null,
  note text,
  fulfillment_type text not null check (fulfillment_type in ('pickup','delivery')),
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key,
  order_id uuid references orders(id),
  seller_id uuid not null references users(id),
  buyer_id uuid not null references users(id),
  total_amount numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
