import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@jaad-pos/shared';
import { Order } from '../types';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:4000';

export function useOrderSocket(restaurantId: string) {
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
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
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
