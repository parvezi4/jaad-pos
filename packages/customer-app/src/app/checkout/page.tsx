'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { submitOrder } from '../../lib/api';
import Link from 'next/link';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

type PaymentMethod = 'QRIS' | 'OVO' | 'CASH';
type CheckoutStep = 'review' | 'payment' | 'success';

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get('table') ?? '';
  const restaurantId = searchParams.get('restaurant') ?? '';

  if (!tableId || !restaurantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-red-500 text-lg">Invalid checkout link. Table or restaurant info is missing.</p>
        <Link href="/" className="text-blue-600 underline">Go Home</Link>
      </div>
    );
  }

  const [step, setStep] = useState<CheckoutStep>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePaymentConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await submitOrder({
        tableId,
        restaurantId,
        customerName: customerName || undefined,
        paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      });
      setOrderId(order.id);
      clearCart();
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <Link href={`/menu/jaad-cafe?table=${tableId}`} className="text-blue-600 underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" data-testid="order-success">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Your order has been sent to the kitchen.</p>
        {orderId && <p className="text-xs text-gray-400 font-mono mb-6">Order ID: {orderId}</p>}
        <Link
          href={`/menu/jaad-cafe?table=${tableId}`}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold"
          data-testid="order-again-btn"
        >
          Order Again
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <Link href={`/menu/jaad-cafe?table=${tableId}`} className="text-blue-600 text-lg">
          ←
        </Link>
        <h1 className="text-lg font-semibold">{step === 'review' ? 'Your Order' : 'Payment'}</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {step === 'review' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">Order Summary</h2>
              {items.map((item) => (
                <div key={item.menuItemId} className="flex justify-between py-2 border-b border-gray-100 last:border-0" data-testid={`cart-item-${item.menuItemId}`}>
                  <span className="text-gray-800">
                    {item.name} <span className="text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-1 font-bold text-lg">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name (optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alice"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="customer-name-input"
              />
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg"
              data-testid="proceed-to-payment-btn"
            >
              Proceed to Payment
            </button>
          </>
        )}

        {step === 'payment' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">Select Payment Method</h2>
              {(['QRIS', 'OVO', 'CASH'] as PaymentMethod[]).map((method) => (
                <label key={method} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-lg">
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    data-testid={`payment-${method.toLowerCase()}`}
                  />
                  <span className="font-medium">{method}</span>
                  {method === 'QRIS' && (
                    <span className="text-xs text-gray-400 ml-auto">Scan QR Code</span>
                  )}
                  {method === 'OVO' && (
                    <span className="text-xs text-gray-400 ml-auto">Digital Wallet</span>
                  )}
                </label>
              ))}
            </div>

            {paymentMethod === 'QRIS' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4 text-center">
                <p className="text-sm text-gray-500 mb-3">Scan to pay</p>
                <div className="w-40 h-40 mx-auto bg-gray-200 rounded-lg flex items-center justify-center" data-testid="qris-placeholder">
                  <span className="text-4xl">📲</span>
                </div>
                <p className="text-xs text-gray-400 mt-3">Simulated QRIS for demo</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm" data-testid="order-error">
                {error}
              </div>
            )}

            <button
              onClick={handlePaymentConfirm}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
              data-testid="confirm-payment-btn"
            >
              {loading ? 'Processing...' : `Confirm Payment — ${formatPrice(totalAmount)}`}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
