const express = require('express');
const path = require('path');
const db = require('./db');
const { createToken, requireAuth, requireRole } = require('./auth');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/auth/login', (req, res) => {
  const { phone } = req.body;
  const user = db.prepare('select * from users where phone=?').get(phone);
  if (!user) return bad(res, 'invalid credentials', 401);
  const token = createToken(user);
  res.json({ token, user: { id: user.id, role: user.role, full_name: user.full_name } });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

function bad(res, msg, code = 400) { return res.status(code).json({ error: msg }); }

app.post('/api/users/register', (req, res) => {
  const { role, full_name, phone, town, region, language } = req.body;
  if (!role || !full_name || !phone) return bad(res, 'role, full_name, phone required');
  const r = db.prepare('insert into users (role, full_name, phone, town, region, language) values (?, ?, ?, ?, ?, ?)')
    .run(role, full_name, phone, town || null, region || null, language || 'en');
  res.status(201).json({ id: r.lastInsertRowid });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('select * from users where id=?').get(req.params.id);
  if (!user) return bad(res, 'user not found', 404);
  res.json(user);
});

app.post('/api/listings', requireAuth, requireRole('seller','admin'), (req, res) => {
  const { title, category, quantity, unit, price, town, region, delivery_available, pickup_available, photo_data_url } = req.body;
  const seller_id = req.user.id;
  if (!seller_id || !title || !category || !quantity || !unit || !price) return bad(res, 'missing required fields');
  const r = db.prepare(`insert into listings (seller_id, title, category, quantity, unit, price, town, region, delivery_available, pickup_available)
  values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(seller_id, title, category, quantity, unit, price, town || null, region || null, delivery_available ? 1 : 0, pickup_available === false ? 0 : 1, photo_data_url || null);
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

app.post('/api/orders', requireAuth, requireRole('buyer','admin'), (req, res) => {
  const { listing_id, quantity, note, fulfillment_type } = req.body;
  const buyer_id = req.user.id;
  const listing = db.prepare('select * from listings where id=?').get(listing_id);
  if (!listing) return bad(res, 'listing not found', 404);
  const r = db.prepare(`insert into orders (listing_id, buyer_id, seller_id, quantity, note, fulfillment_type)
    values (?, ?, ?, ?, ?, ?)`)
    .run(listing_id, buyer_id, listing.seller_id, quantity, note || null, fulfillment_type || 'pickup');
  res.status(201).json({ id: r.lastInsertRowid });
});

app.get('/api/orders/:userId', (req, res) => {
  const rows = db.prepare(`select o.*, l.title from orders o join listings l on l.id=o.listing_id
  where o.buyer_id=? or o.seller_id=? order by o.created_at desc`).all(req.params.userId, req.params.userId);
  res.json(rows);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('update orders set status=?, updated_at=current_timestamp where id=?').run(status, req.params.id);
  const order = db.prepare('select * from orders where id=?').get(req.params.id);
  res.json(order);
});

app.post('/api/ledger', requireAuth, requireRole('seller','admin'), (req, res) => {
  const { order_id, seller_id, buyer_id, total_amount, amount_paid, due_date } = req.body;
  const status = (amount_paid || 0) >= total_amount ? 'closed' : 'open';
  const r = db.prepare(`insert into ledger_entries (order_id, seller_id, buyer_id, total_amount, amount_paid, due_date, status)
    values (?, ?, ?, ?, ?, ?, ?)`)
    .run(order_id || null, seller_id, buyer_id, total_amount, amount_paid || 0, due_date || null, status);
  res.status(201).json({ id: r.lastInsertRowid, status });
});

app.patch('/api/ledger/:id/payment', (req, res) => {
  const { amount } = req.body;
  const entry = db.prepare('select * from ledger_entries where id=?').get(req.params.id);
  if (!entry) return bad(res, 'entry not found', 404);
  const paid = Number(entry.amount_paid) + Number(amount || 0);
  const status = paid >= entry.total_amount ? 'closed' : 'open';
  db.prepare('update ledger_entries set amount_paid=?, status=? where id=?').run(paid, status, req.params.id);
  res.json({ id: Number(req.params.id), amount_paid: paid, status });
});

app.get('/api/ledger/:sellerId', (req, res) => res.json(db.prepare('select * from ledger_entries where seller_id=? order by created_at desc').all(req.params.sellerId)));

app.post('/api/deliveries', requireAuth, requireRole('seller','admin'), (req, res) => {
  const { order_id, transporter_id, fee, eta_hours } = req.body;
  const r = db.prepare('insert into deliveries (order_id, transporter_id, fee, eta_hours, status) values (?, ?, ?, ?, ?)')
    .run(order_id, transporter_id || null, fee || 0, eta_hours || null, transporter_id ? 'accepted' : 'open');
  res.status(201).json({ id: r.lastInsertRowid });
});
app.get('/api/deliveries/open', (_req, res) => res.json(db.prepare("select * from deliveries where status='open' order by created_at desc").all()));
app.patch('/api/deliveries/:id/accept', requireAuth, requireRole('transporter','admin'), (req, res) => {
  db.prepare("update deliveries set transporter_id=?, status='accepted' where id=? and status='open'").run(req.user.id, req.params.id);
  res.json({ ok: true });
});
app.patch('/api/deliveries/:id/status', requireAuth, requireRole('transporter','seller','admin'), (req, res) => {
  db.prepare('update deliveries set status=? where id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

app.post('/api/messages', requireAuth, (req, res) => {
  const { to_user_id, order_id, body } = req.body;
  const r = db.prepare('insert into messages (from_user_id, to_user_id, order_id, body) values (?, ?, ?, ?)').run(req.user.id, to_user_id, order_id || null, body);
  res.status(201).json({ id: r.lastInsertRowid });
});
app.get('/api/messages/thread', (req, res) => {
  const { a, b } = req.query;
  const rows = db.prepare(`select * from messages where (from_user_id=? and to_user_id=?) or (from_user_id=? and to_user_id=?) order by created_at asc`).all(a, b, b, a);
  res.json(rows);
});

app.get('/api/prices', (_req, res) => res.json(db.prepare('select * from price_board order by updated_at desc').all()));
app.post('/api/prices', requireAuth, requireRole('admin','seller'), (req, res) => {
  const { commodity, unit, min_price, max_price, town } = req.body;
  db.prepare('insert into price_board (commodity, unit, min_price, max_price, town) values (?, ?, ?, ?, ?)').run(commodity, unit, min_price, max_price, town || null);
  res.status(201).json({ ok: true });
});

app.get('/api/prices/feed', (_req, res) => {
  const rows = db.prepare('select commodity, unit, avg((min_price+max_price)/2) as avg_price, count(*) as samples from price_board group by commodity, unit order by commodity asc').all();
  res.json(rows);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`TradeGrid app running on ${port}`));
