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

Xendit variables (for payment sandbox):

- XENDIT_SECRET_KEY
- XENDIT_WEBHOOK_VERIFICATION_TOKEN
- XENDIT_PUBLIC_KEY (optional for MVP backend flow, useful for future client-side card flow)

Example:

~~~env
DATABASE_URL="postgresql://user:password@localhost:5432/jaad_pos?schema=public"
PORT=4000
CLIENT_URL="http://localhost:3000"
CORS_ORIGINS="http://127.0.0.1:3000"
XENDIT_SECRET_KEY="xnd_development_your_secret_key"
XENDIT_WEBHOOK_VERIFICATION_TOKEN="your_webhook_verification_token"
XENDIT_PUBLIC_KEY="xnd_public_development_your_public_key"
~~~

For complete Xendit sandbox setup and local testing workflow, see docs/payment-sandbox-local-testing.md.

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

### 5. Run POS Metro Interface (Bootstrap)

**Status:**
- Metro bundler is configured and can run.
- Native Android project scaffold is not yet included in this repo.
- Tracking issue: #8 (Scaffold native Android project for POS app)

**Steps:**

1. Start Metro bundler:

~~~bash
npm run start --workspace=packages/pos-app
~~~

2. Native Android run is pending scaffold work:

~~~bash
# Not available yet (expected to fail until issue #8 is implemented)
npm run android --workspace=packages/pos-app
~~~

**Notes:**
- Metro bundler runs on http://localhost:8081 by default
- This is useful for validating React Native/Metro wiring before full native app setup.

### 6. Quick verification

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

# POS Metro bootstrap check
npm run start --workspace=packages/pos-app  # Terminal 1: Metro bundler
~~~

### Lint (customer app)

~~~bash
npm run lint --workspace=packages/customer-app
~~~

## Known Security Advisory

- `npm audit` currently reports a moderate advisory for `postcss <8.5.10` through Next.js's nested dependency tree.
- The app-level `postcss` dependency is already on a patched version, but `next@15.5.15` still installs its own nested `postcss@8.4.31`.
- This is currently tracked in GitHub issue `#11`.
- Do not run `npm audit fix --force` for this advisory. npm suggests downgrading Next.js to `9.3.3`, which is not a safe or valid remediation path for this project.
- Current guidance: treat this as an accepted temporary risk, monitor Next.js releases, and re-run `npm audit`, `npm outdated next`, and `npm ls postcss --workspace=packages/customer-app` when evaluating upgrades.
- In CI or local checks, prefer `npm audit --audit-level=high` so only high/critical issues fail the build.

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

### POS app won't connect to backend

- This will apply after issue #8 is completed and native Android app execution is available.
- For now, validate Metro startup only.

### Android build fails with "Could not find gradle.properties"

Expected for now because native Android project scaffold is not yet present.

### App crashes on startup

- Verify backend is running and reachable
- Check MongoDB/Prisma connection is working (backend logs will show errors)
- Try clearing build cache: `cd packages/pos-app && npx react-native doctor`

## QR Workflow

1. Customer scans QR at table and opens customer app
2. Customer browses menu and adds items to cart
3. Customer confirms payment in checkout
4. Backend stores order and emits new_order via Socket.io
5. POS receives the real-time order event