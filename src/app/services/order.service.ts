import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface pour une commande
 */
export interface Order {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    state?: string;
    country: string;
  } | null;
  products: Array<{
    id: string;
    name: string;
    description: string;
    image: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
  }>;
  payment: {
    status: string;
    amountTotal: number;
    amountSubtotal: number;
    amountShipping: number;
    currency: string;
  };
  status: string;
  deliveryStatus: 'pending' | 'shipped' | 'delivered';
}

/**
 * Service de gestion des commandes
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ORDERS_STORAGE_KEY = 'user_orders';
  private apiUrl = environment.apiUrl;

  private ordersSubject = new BehaviorSubject<Order[]>(this.loadOrders());
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Charge les commandes depuis localStorage
   */
  private loadOrders(): Order[] {
    const ordersData = localStorage.getItem(this.ORDERS_STORAGE_KEY);
    return ordersData ? JSON.parse(ordersData) : [];
  }

  /**
   * Sauvegarde les commandes dans localStorage
   */
  private saveOrders(orders: Order[]): void {
    localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(orders));
    this.ordersSubject.next(orders);
  }

  /**
   * Récupère les détails d'une session Stripe et l'ajoute aux commandes
   */
  fetchOrderDetails(sessionId: string): Observable<{ success: boolean; order: Order }> {
    return this.http.get<{ success: boolean; order: Order }>(
      `${this.apiUrl}/session-details?session_id=${sessionId}`
    ).pipe(
      tap(response => {
        if (response.success && response.order) {
          this.addOrder(response.order);
        }
      })
    );
  }

  /**
   * Ajoute une commande à l'historique
   */
  addOrder(order: Order): void {
    const currentOrders = this.loadOrders();

    // Vérifier si la commande existe déjà
    const exists = currentOrders.some(o => o.id === order.id);
    if (!exists) {
      currentOrders.unshift(order); // Ajouter au début
      this.saveOrders(currentOrders);
    }
  }

  /**
   * Récupère toutes les commandes
   */
  getOrders(): Order[] {
    return this.loadOrders();
  }

  /**
   * Récupère une commande par ID
   */
  getOrderById(orderId: string): Order | undefined {
    return this.loadOrders().find(o => o.id === orderId);
  }

  /**
   * Met à jour le statut de livraison d'une commande
   */
  updateDeliveryStatus(orderId: string, status: 'pending' | 'shipped' | 'delivered'): void {
    const orders = this.loadOrders();
    const order = orders.find(o => o.id === orderId);

    if (order) {
      order.deliveryStatus = status;
      this.saveOrders(orders);
    }
  }

  /**
   * Supprime toutes les commandes (pour le développement)
   */
  clearOrders(): void {
    localStorage.removeItem(this.ORDERS_STORAGE_KEY);
    this.ordersSubject.next([]);
  }
}
