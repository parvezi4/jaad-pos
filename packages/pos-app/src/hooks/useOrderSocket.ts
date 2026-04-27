import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@jaad-pos/shared';
import { Order } from '../types';

function getDefaultSocketUrl() {
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

// EXPO_PUBLIC_SOCKET_URL is used when running via Expo (Expo Go / EAS builds).
// SOCKET_URL is the bare RN CLI fallback. On physical iOS devices neither localhost
// nor 10.0.2.2 will reach your dev machine — set EXPO_PUBLIC_SOCKET_URL to your
// LAN IP (e.g. http://192.168.1.x:4000) in packages/pos-app/.env
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  process.env.SOCKET_URL ||
  getDefaultSocketUrl();

export function useOrderSocket(restaurantId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setConnected(false);
      return;
    }

    console.log('[POS] Connecting socket to', SOCKET_URL);
    const socket = io(SOCKET_URL, {
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_RESTAURANT, restaurantId);
      console.log(`[POS] Connected to server, joined room: ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[POS] Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      setConnected(false);
      console.log('[POS] Socket connect error:', error.message, 'url:', SOCKET_URL);
    });

    socket.on(SOCKET_EVENTS.NEW_ORDER, (order: Order) => {
      console.log('[POS] New order received:', order.id);
      addOrder(order);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId, addOrder]);

  return { orders, connected, removeOrder };
}
