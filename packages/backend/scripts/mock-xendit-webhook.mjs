import 'dotenv/config';

const [orderId, statusArg] = process.argv.slice(2);
const status = (statusArg || 'PAID').toUpperCase();
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '4000'}`;
const callbackToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;

if (!orderId) {
  console.error('Usage: npm run test:xendit:webhook --workspace=packages/backend -- <orderId> [PAID|PENDING|EXPIRED]');
  process.exit(1);
}

if (!callbackToken) {
  console.error('Missing XENDIT_WEBHOOK_VERIFICATION_TOKEN in environment.');
  process.exit(1);
}

const externalId = `order_${orderId}_${Date.now()}`;

const payload = {
  id: `inv-test-${Date.now()}`,
  external_id: externalId,
  status,
  paid_amount: 0,
  payment_method: status === 'PAID' ? 'QRIS' : null,
};

const response = await fetch(`${backendUrl}/api/payments/webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-callback-token': callbackToken,
  },
  body: JSON.stringify(payload),
});

const text = await response.text();

if (!response.ok) {
  console.error(`[Webhook Test] Failed (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`[Webhook Test] Success (${response.status})`);
console.log(text);
