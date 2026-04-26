import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { emitNewOrder } from '../lib/socket';
import { OrderStatus } from '@jaad-pos/shared';
import type { Order } from '@jaad-pos/shared';

const router = Router();

const CreateOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const CreateOrderSchema = z.object({
  tableId: z.string().min(1),
  restaurantId: z.string().min(1),
  customerName: z.string().optional(),
  paymentMethod: z.string().optional(),
  items: z.array(CreateOrderItemSchema).nonempty(),
});

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    const { tableId, restaurantId, customerName, paymentMethod, items } = parsed.data;

    // Verify table belongs to restaurant
    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!table) {
      return res.status(404).json({ error: 'Table not found for this restaurant' });
    }

    // Fetch menu items to validate and get prices
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more menu items are unavailable or not found' });
    }

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      totalAmount += Number(menuItem.price) * item.quantity;
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        tableId,
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
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Emit to POS clients in the restaurant's room
    const orderPayload: Order = {
      id: order.id,
      status: order.status as OrderStatus,
      totalAmount: Number(order.totalAmount),
      customerName: order.customerName,
      paymentMethod: order.paymentMethod,
      tableId: order.tableId,
      table: order.table
        ? {
            id: order.table.id,
            number: order.table.number,
            qrCode: order.table.qrCode,
            restaurantId: order.table.restaurantId,
            createdAt: order.table.createdAt,
            updatedAt: order.table.updatedAt,
          }
        : undefined,
      restaurantId: order.restaurantId,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
        orderId: item.orderId,
        menuItemId: item.menuItemId,
        menuItem: item.menuItem
          ? {
              id: item.menuItem.id,
              name: item.menuItem.name,
              description: item.menuItem.description,
              price: Number(item.menuItem.price),
              imageUrl: item.menuItem.imageUrl,
              isAvailable: item.menuItem.isAvailable,
              categoryId: item.menuItem.categoryId,
              createdAt: item.menuItem.createdAt,
              updatedAt: item.menuItem.updatedAt,
            }
          : undefined,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    emitNewOrder(restaurantId, orderPayload);

    return res.status(201).json(orderPayload);
  } catch (error) {
    console.error('[Orders] Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('[Orders] Error fetching order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:orderId/status
router.patch('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: true,
        items: { include: { menuItem: true } },
      },
    });

    return res.json(order);
  } catch (error) {
    console.error('[Orders] Error updating order status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
