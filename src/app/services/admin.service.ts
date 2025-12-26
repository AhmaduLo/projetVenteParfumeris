import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StatsResponse } from '../models/admin-stats.model';
import { OrdersResponse, OrderPeriod } from '../models/order.model';
import { SendEmailRequest, SendEmailResponse } from '../models/email.model';
import { UpdateShippingStatusRequest, UpdateShippingStatusResponse, SendDeliveryEmailRequest, SendDeliveryEmailResponse } from '../models/shipping.model';
import { AuthService } from './auth.service';

/**
 * Service pour les opérations admin
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Récupère les statistiques Stripe
   */
  getStats(): Observable<StatsResponse> {
    const headers = this.getAuthHeaders();

    return this.http.get<StatsResponse>(
      `${this.apiUrl}/admin/stats`,
      { headers }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Récupérer les commandes Stripe
   * @param limit Nombre de commandes à récupérer (défaut: 50, max: 100)
   * @param startingAfter ID de session pour la pagination
   * @param period Période de filtrage ('today' | 'month' | 'year' | 'all')
   * @param shippingStatus Statut d'expédition ('pending' | 'shipped' | 'delivered' | 'all')
   */
  getOrders(limit: number = 50, startingAfter?: string, period: OrderPeriod = 'all', shippingStatus: string = 'all'): Observable<OrdersResponse> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('period', period)
      .set('shipping_status', shippingStatus);

    if (startingAfter) {
      params = params.set('starting_after', startingAfter);
    }

    return this.http.get<OrdersResponse>(
      `${this.apiUrl}/admin/orders`,
      { headers, params }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Envoie un email de confirmation d'expédition au client
   * @param orderId ID de la session Stripe
   * @param trackingNumber Numéro de suivi optionnel
   */
  sendShippingEmail(orderId: string, trackingNumber?: string): Observable<SendEmailResponse> {
    const headers = this.getAuthHeaders();
    const body: SendEmailRequest = {
      orderId,
      trackingNumber
    };

    return this.http.post<SendEmailResponse>(
      `${this.apiUrl}/admin/send-email`,
      body,
      { headers }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Met à jour le statut d'expédition d'une commande
   * @param orderId ID de la session Stripe
   * @param shippingStatus Nouveau statut ('pending' | 'shipped' | 'delivered')
   */
  updateShippingStatus(orderId: string, shippingStatus: string): Observable<UpdateShippingStatusResponse> {
    const headers = this.getAuthHeaders();
    const body: UpdateShippingStatusRequest = {
      orderId,
      shippingStatus: shippingStatus as any
    };

    return this.http.post<UpdateShippingStatusResponse>(
      `${this.apiUrl}/admin/update-order-status`,
      body,
      { headers }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Envoie un email de confirmation de réception au client
   * @param orderId ID de la session Stripe
   */
  sendDeliveryEmail(orderId: string): Observable<SendDeliveryEmailResponse> {
    const headers = this.getAuthHeaders();
    const body: SendDeliveryEmailRequest = {
      orderId
    };

    return this.http.post<SendDeliveryEmailResponse>(
      `${this.apiUrl}/admin/send-delivery-email`,
      body,
      { headers }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Créer les headers avec le token JWT
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 401) {
        errorMessage = 'Non authentifié. Veuillez vous reconnecter.';
        // Optionnel : déconnecter l'utilisateur
        this.authService.logout();
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        errorMessage = `Erreur serveur: ${error.status}`;
      }
    }

    console.error('❌ Erreur AdminService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
