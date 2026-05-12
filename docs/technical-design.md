# Technical Design (MVP)

## Offline-first strategy
- Store writes locally in SQLite with sync status flags:
  - `pending_create`, `pending_update`, `synced`, `failed`
- Background sync worker retries with exponential backoff
- Conflict policy: server accepts latest `updated_at`; client keeps shadow copy for review

## Modules
- Auth & Profile
- Listings
- Discovery
- Orders
- Ledger
- Admin

## Syncable entities
- listings
- orders
- ledger_entries
- messages (metadata only in V1)

## Minimal API pattern
- `POST /sync/push` batch local mutations
- `GET /sync/pull?since=<timestamp>` incremental updates

## Security
- JWT auth
- Role-based access control
- Audit log for admin actions
