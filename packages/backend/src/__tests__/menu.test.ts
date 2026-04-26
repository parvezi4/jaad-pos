import request from 'supertest';
import { app } from '../server';

// Mock prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    restaurant: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

const mockRestaurant = {
  id: 'restaurant-1',
  name: 'Jaad Cafe',
  slug: 'jaad-cafe',
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [
    {
      id: 'cat-1',
      name: 'Beverages',
      restaurantId: 'restaurant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      menuItems: [
        {
          id: 'item-1',
          name: 'Espresso',
          description: 'Single shot',
          price: 25000,
          imageUrl: null,
          isAvailable: true,
          categoryId: 'cat-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ],
};

describe('GET /api/menu/:restaurantId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return restaurant with menu', async () => {
    (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

    const res = await request(app).get('/api/menu/restaurant-1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jaad Cafe');
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].menuItems).toHaveLength(1);
  });

  it('should return 404 if restaurant not found', async () => {
    (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/menu/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Restaurant not found');
  });
});
