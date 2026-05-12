const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'tradegrid.db'));
db.pragma('journal_mode = WAL');

const schema = `
create table if not exists users (
  id integer primary key autoincrement,
  role text not null check(role in ('seller','buyer','transporter','admin')),
  full_name text not null,
  phone text not null unique,
  town text,
  region text,
  is_verified integer not null default 0,
  created_at text not null default current_timestamp
);
create table if not exists listings (
  id integer primary key autoincrement,
  seller_id integer not null,
  title text not null,
  category text not null,
  quantity real not null,
  unit text not null,
  price real not null,
  town text,
  region text,
  delivery_available integer not null default 0,
  pickup_available integer not null default 1,
  status text not null default 'active',
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp,
  foreign key(seller_id) references users(id)
);
create table if not exists orders (
  id integer primary key autoincrement,
  listing_id integer not null,
  buyer_id integer not null,
  seller_id integer not null,
  quantity real not null,
  note text,
  fulfillment_type text not null check(fulfillment_type in ('pickup','delivery')),
  status text not null default 'requested',
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp,
  foreign key(listing_id) references listings(id)
);
create table if not exists ledger_entries (
  id integer primary key autoincrement,
  order_id integer,
  seller_id integer not null,
  buyer_id integer not null,
  total_amount real not null,
  amount_paid real not null default 0,
  due_date text,
  status text not null default 'open',
  created_at text not null default current_timestamp
);
`;

db.exec(schema);

module.exports = db;
