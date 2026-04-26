# Jaad POS — Restaurant Management MVP

A full-stack QR-code-to-POS restaurant management system built for high-volume cafes and smokehouses.

## Architecture

```
jaad-pos/
├── packages/
│   ├── shared/         # Shared TypeScript interfaces & constants
│   ├── backend/        # Express + Prisma + Socket.io API server
│   ├── customer-app/   # Next.js 14 PWA (customer ordering)
│   └── pos-app/        # React Native (cashier POS tablet)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Real-Time | Socket.io |
| Customer App | Next.js 14 (React) + Tailwind CSS (PWA) |
| POS App | React Native + TypeScript (Android) |
| Printing | ESC/POS protocol (mock) |
| Payment | QRIS / OVO simulation |
| Testing | Playwright (web E2E) + Jest (unit) |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### 1. Install dependencies
```bash
npm install
```

### 2. Configure backend
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit DATABASE_URL in packages/backend/.env
```

### 3. Initialize database
```bash
cd packages/backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start development servers
```bash
# Backend
npm run dev:backend

# Customer App
npm run dev:customer
```

### 5. Run tests
```bash
# Backend unit tests
npm run test:backend

# Playwright E2E tests (requires running dev server)
npm run test:e2e
```

## API Reference

### Menu
- `GET /api/menu/:restaurantId` — Get full menu by restaurant ID
- `GET /api/menu/slug/:slug` — Get full menu by restaurant slug

### Orders
- `POST /api/orders` — Create a new order (emits Socket.io event to POS)
- `GET /api/orders/:orderId` — Get order details
- `PATCH /api/orders/:orderId/status` — Update order status

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `join_restaurant` | Client → Server | `restaurantId: string` |
| `new_order` | Server → POS | `Order` object |
| `order_updated` | Server → POS | `Order` object |

## QR Code Workflow

1. Customer scans QR at table → opens `customer-app`
2. Customer browses menu, adds items to cart
3. Customer simulates QRIS/OVO payment → order submitted via `POST /api/orders`
4. Backend stores order in PostgreSQL, emits `new_order` via Socket.io
5. POS tablet receives real-time notification, shows order card
6. Cashier presses "Print" → ESC/POS payload generated & sent to thermal printer