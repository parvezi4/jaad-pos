import request from 'supertest';
import { app } from '../server';

jest.mock('../lib/prisma', () => ({
  prisma: {
    table: { findFirst: jest.fn() },
    menuItem: { findMany: jest.fn() },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../lib/socket', () => ({
  initSocket: jest.fn(),
  emitNewOrder: jest.fn(),
  emitOrderUpdated: jest.fn(),
}));

import { prisma } from '../lib/prisma';

const mockTable = {
  id: 'table-1',
  number: 1,
  qrCode: 'JAAD-T1',
  restaurantId: 'restaurant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMenuItem = {
  id: 'item-1',
  name: 'Espresso',
  description: 'Single shot',
  price: 25000,
  imageUrl: null,
  isAvailable: true,
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrder = {
  id: 'order-1',
  status: 'PENDING',
  totalAmount: 25000,
  customerName: 'Alice',
  paymentMethod: 'QRIS',
  tableId: 'table-1',
  restaurantId: 'restaurant-1',
  table: mockTable,
  items: [
    {
      id: 'oi-1',
      quantity: 1,
      unitPrice: 25000,
      notes: null,
      orderId: 'order-1',
      menuItemId: 'item-1',
      menuItem: mockMenuItem,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    (prisma.table.findFirst as jest.Mock).mockResolvedValue(mockTable);
    (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem]);
    (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

    const res = await request(app).post('/api/orders').send({
      tableId: 'table-1',
      restaurantId: 'restaurant-1',
      customerName: 'Alice',
      paymentMethod: 'QRIS',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.items).toHaveLength(1);
  });

  it('should return 400 for invalid request body', async () => {
    const res = await request(app).post('/api/orders').send({ tableId: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request body');
  });

  it('should return 404 if table not found', async () => {
    (prisma.table.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/orders').send({
      tableId: 'table-1',
      restaurantId: 'restaurant-1',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    });

    expect(res.status).toBe(404);
  });
});
