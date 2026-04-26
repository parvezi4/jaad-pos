'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMenuBySlug } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

export default function MenuPage({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, itemCount, totalAmount } = useCart();
  const searchParams = useSearchParams();
  const tableQr = searchParams.get('table');

  useEffect(() => {
    fetchMenuBySlug(params.slug)
      .then(setRestaurant)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading menu">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (error || !restaurant) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-red-500 text-center">{error || 'Menu not found'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">{restaurant.name}</h1>
        {tableQr && <p className="text-blue-200 text-sm">Table: {tableQr}</p>}
      </header>

      {/* Menu */}
      <main className="max-w-2xl mx-auto p-4">
        {restaurant.categories.map((category) => (
          <section key={category.id} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
                  data-testid={`menu-item-${item.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    )}
                    <p className="text-blue-600 font-semibold mt-2">{formatPrice(item.price)}</p>
                  </div>
                  <button
                    onClick={() =>
                      addItem({
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                      })
                    }
                    className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl hover:bg-blue-700 transition-colors flex-shrink-0"
                    data-testid={`add-item-${item.id}`}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg">
          <Link
            href={`/checkout?table=${tableQr}&restaurant=${restaurant.id}`}
            className="flex items-center justify-between max-w-2xl mx-auto"
            data-testid="view-cart-btn"
          >
            <span className="bg-white text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              {itemCount}
            </span>
            <span className="font-semibold">View Cart</span>
            <span className="font-semibold">{formatPrice(totalAmount)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
