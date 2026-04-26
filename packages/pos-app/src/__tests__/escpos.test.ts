import { generateEscPosTicket } from '../utils/escpos';
import { Order, OrderStatus } from '../types';

const mockOrder: Order = {
  id: 'order-test-12345678',
  status: OrderStatus.PAID,
  totalAmount: 50000,
  customerName: 'Alice',
  paymentMethod: 'QRIS',
  tableId: 'table-1',
  restaurantId: 'restaurant-1',
  createdAt: new Date('2024-01-01T12:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
  table: { id: 'table-1', number: 3, qrCode: 'JAAD-T3' },
  items: [
    {
      id: 'oi-1',
      quantity: 2,
      unitPrice: 25000,
      notes: null,
      menuItemId: 'item-1',
      menuItem: { id: 'item-1', name: 'Espresso', price: 25000 },
    },
  ],
};

describe('generateEscPosTicket', () => {
  it('should return a Uint8Array', () => {
    const result = generateEscPosTicket(mockOrder);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include order ID in ticket', () => {
    const result = generateEscPosTicket(mockOrder);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('12345678');
  });

  it('should include customer name', () => {
    const result = generateEscPosTicket(mockOrder);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('Alice');
  });

  it('should include table number', () => {
    const result = generateEscPosTicket(mockOrder);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('3');
  });

  it('should include item names', () => {
    const result = generateEscPosTicket(mockOrder);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('Espresso');
  });
});
