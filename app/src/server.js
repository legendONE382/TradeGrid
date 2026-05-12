const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json({ limit: '512kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/users/register', (req, res) => {
  const { role, full_name, phone, town, region } = req.body;
  if (!role || !full_name || !phone) return res.status(400).json({ error: 'role, full_name, phone required' });
  const stmt = db.prepare('insert into users (role, full_name, phone, town, region) values (?, ?, ?, ?, ?)');
  const result = stmt.run(role, full_name, phone, town || null, region || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.post('/api/listings', (req, res) => {
  const { seller_id, title, category, quantity, unit, price, town, region, delivery_available, pickup_available } = req.body;
  if (!seller_id || !title || !category || !quantity || !unit || !price) return res.status(400).json({ error: 'missing required fields' });
  const stmt = db.prepare(`insert into listings (seller_id, title, category, quantity, unit, price, town, region, delivery_available, pickup_available)
  values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const r = stmt.run(seller_id, title, category, quantity, unit, price, town || null, region || null, delivery_available ? 1 : 0, pickup_available === false ? 0 : 1);
  res.status(201).json({ id: r.lastInsertRowid });
});

app.get('/api/listings', (req, res) => {
  const { town, region, q } = req.query;
  const rows = db.prepare(`select l.*, u.full_name seller_name, u.phone
  from listings l join users u on u.id=l.seller_id
  where l.status='active'
  and (? is null or l.town = ?)
  and (? is null or l.region = ?)
  and (? is null or l.title like '%' || ? || '%')
  order by l.updated_at desc`).all(town || null, town || null, region || null, region || null, q || null, q || null);
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const { listing_id, buyer_id, quantity, note, fulfillment_type } = req.body;
  const listing = db.prepare('select * from listings where id=?').get(listing_id);
  if (!listing) return res.status(404).json({ error: 'listing not found' });
  const r = db.prepare(`insert into orders (listing_id, buyer_id, seller_id, quantity, note, fulfillment_type)
    values (?, ?, ?, ?, ?, ?)`)
    .run(listing_id, buyer_id, listing.seller_id, quantity, note || null, fulfillment_type || 'pickup');
  res.status(201).json({ id: r.lastInsertRowid });
});

app.post('/api/ledger', (req, res) => {
  const { order_id, seller_id, buyer_id, total_amount, amount_paid, due_date } = req.body;
  const status = (amount_paid || 0) >= total_amount ? 'closed' : 'open';
  const r = db.prepare(`insert into ledger_entries (order_id, seller_id, buyer_id, total_amount, amount_paid, due_date, status)
    values (?, ?, ?, ?, ?, ?, ?)`)
    .run(order_id || null, seller_id, buyer_id, total_amount, amount_paid || 0, due_date || null, status);
  res.status(201).json({ id: r.lastInsertRowid, status });
});

app.get('/api/ledger/:sellerId', (req, res) => {
  const rows = db.prepare('select * from ledger_entries where seller_id=? order by created_at desc').all(req.params.sellerId);
  res.json(rows);
});

app.post('/api/admin/listings/:id/moderate', (req, res) => {
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'invalid action' });
  const status = action === 'approve' ? 'active' : 'removed';
  db.prepare('update listings set status=?, updated_at=current_timestamp where id=?').run(status, req.params.id);
  res.json({ ok: true, status });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`TradeGrid app running on ${port}`));
