'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { CartItem } from '../lib/cart';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { menuItemId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.menuItemId === action.payload.menuItemId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === action.payload.menuItemId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.menuItemId !== action.payload) };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.menuItemId !== action.payload.menuItemId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.payload.menuItemId ? { ...i, quantity: action.payload.quantity } : i,
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const removeItem = useCallback((menuItemId: string) => dispatch({ type: 'REMOVE_ITEM', payload: menuItemId }), []);
  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId, quantity } }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const totalAmount = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, clearCart, totalAmount, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
