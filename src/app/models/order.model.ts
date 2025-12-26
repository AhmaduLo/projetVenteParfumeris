/**
 * Modèles pour les commandes Stripe
 */

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

export interface OrderCustomer {
  email: string;
  name: string;
}

export type ShippingStatus = 'pending' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  status: string;
  shippingStatus: ShippingStatus;
  trackingNumber: string;
  amount: number;
  currency: string;
  customer: OrderCustomer;
  items: OrderItem[];
  created: number;
  createdDate: string;
  metadata: Record<string, any>;
}

export interface OrdersResponse {
  success: boolean;
  orders?: Order[];
  hasMore?: boolean;
  count?: number;
  error?: string;
  message?: string;
}

export type OrderPeriod = 'today' | 'month' | 'year' | 'all';
