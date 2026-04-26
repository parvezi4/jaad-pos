import { Server as SocketIOServer } from 'socket.io';
import { SOCKET_EVENTS } from '@jaad-pos/shared';
import type { Order } from '@jaad-pos/shared';

let io: SocketIOServer | null = null;

export function initSocket(server: SocketIOServer): void {
  io = server;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_RESTAURANT, (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`[Socket] Client ${socket.id} joined restaurant room: ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

export function emitNewOrder(restaurantId: string, order: Order): void {
  if (!io) {
    console.warn('[Socket] Socket.io not initialized');
    return;
  }
  io.to(`restaurant:${restaurantId}`).emit(SOCKET_EVENTS.NEW_ORDER, order);
}

export function emitOrderUpdated(restaurantId: string, order: Order): void {
  if (!io) {
    console.warn('[Socket] Socket.io not initialized');
    return;
  }
  io.to(`restaurant:${restaurantId}`).emit(SOCKET_EVENTS.ORDER_UPDATED, order);
}
