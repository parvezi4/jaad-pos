# Jaad POS - Restaurant Management MVP

A full-stack QR-code-to-POS restaurant management system.

## Monorepo Structure

~~~text
jaad-pos/
|- packages/
|  |- shared/         Shared TypeScript interfaces and constants
|  |- backend/        Express + Prisma + Socket.io API server
|  |- customer-app/   Next.js customer ordering app
|  |- pos-app/        React Native cashier POS app
~~~

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Real-Time | Socket.io |
| Customer App | Next.js + React + Tailwind CSS |
| POS App | React Native + TypeScript |
| Testing | Playwright (web E2E) + Jest |

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (local) or Supabase Postgres

### 1. Install dependencies

~~~bash
npm install
~~~

### 2. Configure backend environment

Create packages/backend/.env from packages/backend/.env.example.

Required variables:

- DATABASE_URL
- PORT (default: 4000)
- CLIENT_URL (default: http://localhost:3000)

Optional variable:

- CORS_ORIGINS (comma-separated extra origins)

Example:

~~~env
DATABASE_URL="postgresql://user:password@localhost:5432/jaad_pos?schema=public"
PORT=4000
CLIENT_URL="http://localhost:3000"
CORS_ORIGINS="http://127.0.0.1:3000"
~~~

### 3. Initialize database

From repo root:

~~~bash
npm run db:generate --workspace=packages/backend
npm run db:migrate --workspace=packages/backend
npm run db:seed --workspace=packages/backend
~~~

### 4. Run apps

In separate terminals:

~~~bash
# Terminal 1 (backend API)
npm run dev:backend

# Terminal 2 (customer app)
npm run dev:customer
~~~

Notes:

- dev:backend builds packages/shared first, then starts backend.
- Backend runs on http://localhost:4000
- Customer app runs on http://localhost:3000

### 5. Quick verification

Open these URLs:

- Customer UI: http://localhost:3000
- Backend root info: http://localhost:4000
- Health check: http://localhost:4000/health
- Demo menu endpoint: http://localhost:4000/api/menu/slug/jaad-cafe

## Common Commands

### Build

~~~bash
npm run build:shared
npm run build:backend
npm run build:customer
~~~

### Tests

~~~bash
# Backend unit tests
npm run test:backend

# Customer E2E tests
npm run test:e2e

# POS unit tests
npm run test --workspace=packages/pos-app
~~~

### Lint (customer app)

~~~bash
npm run lint --workspace=packages/customer-app
~~~

## API Reference

### Menu

- GET /api/menu/:restaurantId - Get full menu by restaurant ID
- GET /api/menu/slug/:slug - Get full menu by restaurant slug

### Orders

- POST /api/orders - Create a new order (emits Socket.io event to POS)
- GET /api/orders/:orderId - Get order details
- PATCH /api/orders/:orderId/status - Update order status

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| join_restaurant | Client to Server | restaurantId: string |
| new_order | Server to POS | Order object |
| order_updated | Server to POS | Order object |

## Troubleshooting

### Backend shows Not found at /

Backend is API-only. The root URL returns JSON metadata, not a web UI. Use http://localhost:3000 for the customer interface.

### CORS errors from customer app

- Confirm backend .env has CLIENT_URL set to your frontend origin.
- Add extra origins in CORS_ORIGINS if needed.
- Restart backend after env changes.

### Table not found for this restaurant during checkout

- Re-run seed command:

~~~bash
npm run db:seed --workspace=packages/backend
~~~

- Ensure checkout URL includes table and restaurant query parameters.

### Port already in use (EADDRINUSE)

Stop the process already using the port, or set a different PORT in packages/backend/.env.

## QR Workflow

1. Customer scans QR at table and opens customer app
2. Customer browses menu and adds items to cart
3. Customer confirms payment in checkout
4. Backend stores order and emits new_order via Socket.io
5. POS receives the real-time order event