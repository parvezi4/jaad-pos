import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/menu/:restaurantId
router.get('/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        categories: {
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error('[Menu] Error fetching menu:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/menu/slug/:slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error('[Menu] Error fetching menu by slug:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
