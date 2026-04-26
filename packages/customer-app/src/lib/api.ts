const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
