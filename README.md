# TradeGrid — Rural Trade Network App

TradeGrid is an offline-first marketplace and logistics app for rural and semi-rural commerce.

## What is implemented now
Main app features now include role registration, listings, orders, debts, delivery jobs, chat messages, and price board modules.
This repository now includes a runnable MVP web app + backend API with:
- Seller registration
- Product listing
- Local browsing/filter by town
- Order requests
- Debt ledger entries
- Simple admin moderation for listings
- Offline-first listing queue in the client (stores pending listings in localStorage and retries on reconnect)

## Run locally
```bash
cd app
npm install
npm start
```
Then open `http://localhost:3000`.

## Structure
- `app/src/server.js` Express API + static hosting
- `app/src/db.js` SQLite schema initialization
- `app/public/index.html` lightweight rural-first UI
- `app/public/app.js` client logic and offline queue sync
- `schema/mvp.sql` original relational SQL reference
- `api-spec/openapi.yaml` draft contract

## Next build steps
- Add role-based auth
- Transporter delivery jobs
- Local language packs
- Price board feed
- Data compression for photos
- Android packaging (PWA/TWA or React Native)
