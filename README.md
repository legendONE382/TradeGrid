# Rural Trade Network App (TradeGrid)

Offline-first local commerce system for rural and semi-rural communities.

## V1 Scope
- Seller registration
- Product listing (offline-first sync)
- Local browsing
- Order request flow
- Debt tracking (ledger)
- Simple admin moderation panel

## Architecture (MVP)
- **Mobile app**: Android-first (React Native)
- **Local storage**: SQLite for offline persistence
- **Sync engine**: pull/push queue with conflict resolution by `updatedAt`
- **Backend API**: Node.js + Express + PostgreSQL
- **Realtime-lite**: polling + lightweight notifications

## User Roles
- Seller
- Buyer
- Transporter
- Admin

## Core Domain Models
- User
- Listing
- Order
- LedgerEntry
- DeliveryJob
- PriceReport
- Message

## Repository Structure
- `docs/` product and technical docs
- `schema/` initial SQL schema for MVP
- `api-spec/` OpenAPI draft for core endpoints

## Next Step
Use this baseline to scaffold mobile + API services and implement the V1 flows.
