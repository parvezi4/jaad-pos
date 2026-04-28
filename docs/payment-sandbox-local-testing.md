# Payment Sandbox Local Testing (Xendit MVP)

This guide explains how to run and verify the Xendit payment workflow locally using sandbox credentials.

## 1. Prerequisites

- Backend and customer app dependencies installed at repo root:

```bash
npm install
```

- Database migrated and seeded:

```bash
npm run db:generate --workspace=packages/backend
npm run db:migrate --workspace=packages/backend
npm run db:seed --workspace=packages/backend
```

## 2. Environment setup

Create or update packages/backend/.env with these values:

```env
DATABASE_URL="postgresql://..."
PORT=4000
CLIENT_URL="http://localhost:3000"
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_WEBHOOK_VERIFICATION_TOKEN="..."
XENDIT_PUBLIC_KEY="xnd_public_development_..."
```

Notes:

- packages/backend/.env is gitignored and must not be committed.
- Use only sandbox keys for local testing.

## 3. Run applications

In separate terminals:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:customer
```

Open:

- Customer app: http://localhost:3000
- Backend health: http://localhost:4000/health

## 4. Payment workflow manual test

1. Open a menu page with table and restaurant query params.
2. Add item(s) to cart and open checkout.
3. Select QRIS or CARD.
4. Click Create Payment Session.
5. Confirm that checkout URL and order ID are shown.
6. For local completion test, simulate Xendit callback:

```bash
npm run test:xendit:webhook --workspace=packages/backend -- <orderId> PAID
```

7. Return to checkout and click Check Payment Status.
8. Expected result: order flow reaches success state.

## 5. Webhook security test

Send invalid token callback and verify rejection:

```bash
curl -X POST http://localhost:4000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-callback-token: invalid-token" \
  -d '{"external_id":"order_order-1_1714000000","status":"PAID"}'
```

Expected: HTTP 401 with unauthorized webhook signature error.

## 6. Automated backend workflow tests

Run payment-specific integration tests:

```bash
npm run test --workspace=packages/backend -- payments.test.ts
```

Coverage in this suite:

- Payment session creation (amount calculation + invoice wiring)
- Webhook signature validation (reject invalid token)
- PAID webhook idempotency (status update happens only once)

## 7. Optional tunnel test with real sandbox callback

If you want callback from Xendit dashboard instead of mock script:

1. Run a tunnel (ngrok/cloudflared) to expose localhost:4000.
2. Set webhook URL in Xendit test dashboard to:

```text
https://<public-url>/api/payments/webhook
```

3. Set callback verification token in dashboard equal to XENDIT_WEBHOOK_VERIFICATION_TOKEN.
4. Trigger payment in sandbox hosted page and confirm backend receives callback.

## 8. Troubleshooting

- 500 when creating payment session:
  - Check XENDIT_SECRET_KEY is present and valid sandbox key.
- 401 on webhook simulation:
  - Check XENDIT_WEBHOOK_VERIFICATION_TOKEN in .env matches request header.
- Order not moving to PAID:
  - Ensure external_id format remains order_<orderId>_<timestamp>.
  - Verify webhook payload status is exactly PAID.
