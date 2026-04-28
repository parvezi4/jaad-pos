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

jest.mock('../lib/env', () => ({
  getXenditEnv: jest.fn(() => ({
    XENDIT_SECRET_KEY: 'xnd_development_test',
    XENDIT_WEBHOOK_VERIFICATION_TOKEN: 'test-webhook-token',
  })),
}));

jest.mock('../lib/xendit', () => ({
  createXenditInvoice: jest.fn(),
}));

import { prisma } from '../lib/prisma';
import { createXenditInvoice } from '../lib/xendit';

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
  totalAmount: 50000,
  customerName: 'Alice',
  paymentMethod: 'QRIS',
  tableId: 'table-1',
  restaurantId: 'restaurant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Payment workflow integration (API-level)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates payment session for QRIS order and returns hosted checkout payload', async () => {
    (prisma.table.findFirst as jest.Mock).mockResolvedValue(mockTable);
    (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem]);
    (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
    (createXenditInvoice as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      external_id: 'order_order-1_1714000000',
      status: 'PENDING',
      amount: 50000,
      invoice_url: 'https://checkout.xendit.co/web/inv-1',
      expiry_date: '2026-04-30T10:00:00.000Z',
    });

    const res = await request(app).post('/api/payments/session').send({
      tableId: 'JAAD-T1',
      restaurantId: 'restaurant-1',
      customerName: 'Alice',
      paymentMethod: 'QRIS',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBe('order-1');
    expect(res.body.checkoutUrl).toBe('https://checkout.xendit.co/web/inv-1');
    expect(res.body.invoiceStatus).toBe('PENDING');
    expect(res.body.qrCodeUrl).toContain(encodeURIComponent('https://checkout.xendit.co/web/inv-1'));

    expect(createXenditInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50000,
        availablePaymentMethods: ['QRIS'],
      }),
    );
  });

  it('rejects webhook when callback token is invalid', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-callback-token', 'wrong-token')
      .send({
        external_id: 'order_order-1_1714000000',
        status: 'PAID',
      });

    expect(res.status).toBe(401);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('handles PAID webhook idempotently by updating once only', async () => {
    (prisma.order.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'order-1', status: 'PENDING' })
      .mockResolvedValueOnce({ id: 'order-1', status: 'PAID' });
    (prisma.order.update as jest.Mock).mockResolvedValue({ id: 'order-1', status: 'PAID' });

    const first = await request(app)
      .post('/api/payments/webhook')
      .set('x-callback-token', 'test-webhook-token')
      .send({
        external_id: 'order_order-1_1714000000',
        status: 'PAID',
      });

    const second = await request(app)
      .post('/api/payments/webhook')
      .set('x-callback-token', 'test-webhook-token')
      .send({
        external_id: 'order_order-1_1714000000',
        status: 'PAID',
      });

    expect(first.status).toBe(200);
    expect(first.body.updated).toBe(true);

    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);

    expect(prisma.order.update).toHaveBeenCalledTimes(1);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'PAID' },
    });
  });
});
