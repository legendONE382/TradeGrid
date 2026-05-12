const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'tradegrid.db'));
db.pragma('journal_mode = WAL');

db.exec(`
create table if not exists users (
  id integer primary key autoincrement,
  role text not null check(role in ('seller','buyer','transporter','admin')),
  full_name text not null,
  phone text not null unique,
  town text, region text, language text not null default 'en',
  is_verified integer not null default 0,
  created_at text not null default current_timestamp
);
create table if not exists listings (
  id integer primary key autoincrement, seller_id integer not null,
  title text not null, category text not null, quantity real not null,
  unit text not null, price real not null, town text, region text,
  delivery_available integer not null default 0, pickup_available integer not null default 1,
  status text not null default 'active', photo_data_url text, created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);
create table if not exists orders (
  id integer primary key autoincrement, listing_id integer not null, buyer_id integer not null,
  seller_id integer not null, quantity real not null, note text,
  fulfillment_type text not null check(fulfillment_type in ('pickup','delivery')),
  status text not null default 'requested', created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);
create table if not exists ledger_entries (
  id integer primary key autoincrement, order_id integer, seller_id integer not null,
  buyer_id integer not null, total_amount real not null, amount_paid real not null default 0,
  due_date text, status text not null default 'open', created_at text not null default current_timestamp
);
create table if not exists deliveries (
  id integer primary key autoincrement, order_id integer not null, transporter_id integer,
  fee real not null default 0, eta_hours integer, status text not null default 'open',
  created_at text not null default current_timestamp
);
create table if not exists messages (
  id integer primary key autoincrement, from_user_id integer not null, to_user_id integer not null,
  order_id integer, body text not null, created_at text not null default current_timestamp
);
create table if not exists price_board (
  id integer primary key autoincrement, commodity text not null, unit text not null,
  min_price real not null, max_price real not null, town text,
  updated_at text not null default current_timestamp
);
`);
module.exports = db;

try { db.exec("alter table listings add column photo_data_url text"); } catch (e) {}
