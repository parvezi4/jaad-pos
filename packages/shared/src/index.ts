export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PRINTED = 'PRINTED',
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  restaurantId: string;
  menuItems?: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDto {
  tableId: string;
  restaurantId: string;
  customerName?: string;
  paymentMethod?: string;
  items: CreateOrderItemDto[];
}

export interface MenuResponse {
  restaurant: Restaurant;
  categories: Category[];
}

export const SOCKET_EVENTS = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATED: 'order_updated',
  JOIN_RESTAURANT: 'join_restaurant',
} as const;
