/**
 * Modèles pour les commandes Stripe
 */

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

export interface OrderAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country: string | null;
}

export interface OrderCustomer {
  email: string;
  name: string;
  phone: string | null;
  address: OrderAddress | null;
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
