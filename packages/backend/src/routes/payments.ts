import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getXenditEnv } from '../lib/env';
import { createXenditInvoice } from '../lib/xendit';
import { OrderStatus } from '@jaad-pos/shared';

const router = Router();

const CreatePaymentItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const CreatePaymentSessionSchema = z.object({
  tableId: z.string().min(1),
  restaurantId: z.string().min(1),
  customerName: z.string().optional(),
  paymentMethod: z.enum(['QRIS', 'CARD']),
  items: z.array(CreatePaymentItemSchema).nonempty(),
});

function mapPaymentMethodToXendit(method: 'QRIS' | 'CARD'): string[] {
  if (method === 'QRIS') {
    return ['QRIS'];
  }

  return ['CREDIT_CARD'];
}

function getOrderIdFromExternalId(externalId: string): string | null {
  const parts = externalId.split('_');
  if (parts.length < 3 || parts[0] !== 'order') {
    return null;
  }
  return parts[1] || null;
}

// POST /api/payments/session
router.post('/session', async (req: Request, res: Response) => {
  try {
    const parsed = CreatePaymentSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    const { tableId, restaurantId, customerName, paymentMethod, items } = parsed.data;

    const table = await prisma.table.findFirst({
      where: {
        restaurantId,
        OR: [{ id: tableId }, { qrCode: tableId }],
      },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found for this restaurant' });
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more menu items are unavailable or not found' });
    }

    const menuItemMap = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));
    let totalAmount = 0;

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      totalAmount += Number(menuItem.price) * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        tableId: table.id,
        restaurantId,
        customerName,
        paymentMethod,
        totalAmount,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: Number(menuItemMap.get(item.menuItemId)!.price),
            notes: item.notes,
          })),
        },
      },
    });

    const externalId = `order_${order.id}_${Date.now()}`;
    const invoice = await createXenditInvoice({
      externalId,
      amount: Number(order.totalAmount),
      description: `Order ${order.id} for restaurant ${restaurantId}`,
      customer: customerName ? { given_names: customerName } : undefined,
      availablePaymentMethods: mapPaymentMethodToXendit(paymentMethod),
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(invoice.invoice_url)}`;

    return res.status(201).json({
      orderId: order.id,
      paymentMethod,
      amount: Number(order.totalAmount),
      currency: 'IDR',
      invoiceId: invoice.id,
      invoiceStatus: invoice.status,
      checkoutUrl: invoice.invoice_url,
      qrCodeUrl,
      expiresAt: invoice.expiry_date,
    });
  } catch (error) {
    console.error('[Payments] Error creating payment session:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { XENDIT_WEBHOOK_VERIFICATION_TOKEN } = getXenditEnv();
    const callbackToken = req.header('x-callback-token');

    if (!callbackToken || callbackToken !== XENDIT_WEBHOOK_VERIFICATION_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized webhook signature' });
    }

    const externalId = req.body?.external_id as string | undefined;
    const status = req.body?.status as string | undefined;

    if (!externalId || !status) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const orderId = getOrderIdFromExternalId(externalId);
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid external_id format' });
    }

    if (status === 'PAID') {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      // A missing order should not trigger endless webhook retries.
      if (!existingOrder) {
        return res.status(200).json({ received: true, ignored: 'order_not_found' });
      }

      if (existingOrder.status === OrderStatus.PAID) {
        return res.status(200).json({ received: true, idempotent: true });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      return res.status(200).json({ received: true, updated: true });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Payments] Error handling webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
