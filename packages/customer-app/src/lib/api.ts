const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PaymentSessionResponse {
  orderId: string;
  paymentMethod: 'QRIS' | 'CARD';
  amount: number;
  currency: 'IDR';
  invoiceId: string;
  invoiceStatus: string;
  checkoutUrl: string;
  qrCodeUrl: string;
  expiresAt: string;
}

export async function fetchMenu(restaurantId: string) {
  const res = await fetch(`${API_BASE}/api/menu/${restaurantId}`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function fetchMenuBySlug(slug: string) {
  const res = await fetch(`${API_BASE}/api/menu/slug/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function submitOrder(orderData: {
  tableId: string;
  restaurantId: string;
  customerName?: string;
  paymentMethod: string;
  items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
}) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit order');
  }
  return res.json();
}

export async function createPaymentSession(orderData: {
  tableId: string;
  restaurantId: string;
  customerName?: string;
  paymentMethod: 'QRIS' | 'CARD';
  items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
}): Promise<PaymentSessionResponse> {
  const res = await fetch(`${API_BASE}/api/payments/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create payment session');
  }

  return res.json();
}

export async function fetchOrderById(orderId: string) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch order');
  }
  return res.json();
}
