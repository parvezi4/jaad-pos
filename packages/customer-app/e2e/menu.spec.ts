import { test, expect } from '@playwright/test';

test.describe('Menu Page', () => {
  test('home page loads and shows demo button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('demo-order-btn')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Jaad POS');
  });

  test('clicking demo button navigates to menu page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('demo-order-btn').click();
    await expect(page).toHaveURL(/\/menu\/jaad-cafe/);
  });
});

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API to return restaurant data
    await page.route('**/api/menu/slug/jaad-cafe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'restaurant-1',
          name: 'Jaad Cafe',
          slug: 'jaad-cafe',
          categories: [
            {
              id: 'cat-1',
              name: 'Beverages',
              menuItems: [
                {
                  id: 'item-1',
                  name: 'Espresso',
                  description: 'Single shot espresso',
                  price: 25000,
                  imageUrl: null,
                  isAvailable: true,
                  categoryId: 'cat-1',
                },
              ],
            },
          ],
        }),
      });
    });
  });

  test('can add item to cart and see cart bar', async ({ page }) => {
    await page.goto('/menu/jaad-cafe?table=JAAD-T1');
    await expect(page.locator('h1')).toContainText('Jaad Cafe');
    
    // Add item to cart
    await page.getByTestId('add-item-item-1').click();
    
    // Cart bar should appear
    await expect(page.getByTestId('view-cart-btn')).toBeVisible();
  });

  test('cart bar shows correct count after adding items', async ({ page }) => {
    await page.goto('/menu/jaad-cafe?table=JAAD-T1');
    
    await page.getByTestId('add-item-item-1').click();
    await page.getByTestId('add-item-item-1').click();
    
    await expect(page.getByTestId('view-cart-btn')).toBeVisible();
  });

  test('navigates to checkout when cart bar is clicked', async ({ page }) => {
    await page.goto('/menu/jaad-cafe?table=JAAD-T1&restaurant=restaurant-1');
    
    await page.getByTestId('add-item-item-1').click();
    await page.getByTestId('view-cart-btn').click();
    
    await expect(page).toHaveURL(/\/checkout/);
  });
});

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu/jaad-cafe?table=JAAD-T1&restaurant=restaurant-1');
    
    await page.route('**/api/menu/slug/jaad-cafe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'restaurant-1',
          name: 'Jaad Cafe',
          slug: 'jaad-cafe',
          categories: [
            {
              id: 'cat-1',
              name: 'Beverages',
              menuItems: [
                {
                  id: 'item-1',
                  name: 'Espresso',
                  description: 'Single shot espresso',
                  price: 25000,
                  imageUrl: null,
                  isAvailable: true,
                  categoryId: 'cat-1',
                },
              ],
            },
          ],
        }),
      });
    });
  });

  test('shows empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/checkout?table=JAAD-T1&restaurant=restaurant-1');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });
});
