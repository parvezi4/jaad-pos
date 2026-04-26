import { OrderStatus } from '@jaad-pos/shared';

export { OrderStatus };

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  menuItemId: string;
  menuItem?: MenuItem;
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  customerName: string | null;
  paymentMethod: string | null;
  tableId: string;
  table?: Table;
  restaurantId: string;
  items: OrderItem[];
  createdAt: string; // ISO string from JSON
  updatedAt: string;
}
