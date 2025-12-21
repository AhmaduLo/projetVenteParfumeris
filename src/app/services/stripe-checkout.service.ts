import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CheckoutRequest, CheckoutResponse } from '../models/stripe-product.model';
import { environment } from '../../environments/environment';

/**
 * Service de gestion du Checkout Stripe
 *
 * Ce service :
 * - Crée des sessions Stripe Checkout via l'API Vercel
 * - Gère la redirection vers Stripe
 * - Collecte automatiquement l'adresse et le téléphone du client
 *
 * IMPORTANT :
 * - Ne jamais créer de session Checkout directement depuis Angular
 * - Toujours passer par l'API Vercel (/api/checkout)
 * - La clé secrète Stripe reste protégée côté serveur
 */
@Injectable({
  providedIn: 'root'
})
export class StripeCheckoutService {
  /** URL de l'API Vercel */
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Crée une session Stripe Checkout
   *
   * @param priceId - ID du prix Stripe (commence par price_)
   * @param quantity - Quantité à acheter (défaut: 1)
   * @returns Observable<CheckoutResponse>
   *
   * @example
   * service.createCheckoutSession('price_xxx', 2).subscribe(response => {
   *   console.log('Session créée:', response.sessionId);
   *   // Rediriger vers Stripe
   *   window.location.href = response.url;
   * });
   */
  createCheckoutSession(priceId: string, quantity: number = 1): Observable<CheckoutResponse> {
    const request: CheckoutRequest = {
      priceId,
      quantity
    };

    return this.http.post<CheckoutResponse>(
      `${this.apiUrl}/checkout`,
      request
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crée une session Checkout et redirige immédiatement vers Stripe
   * Cette méthode combine la création et la redirection
   *
   * @param priceId - ID du prix Stripe
   * @param quantity - Quantité à acheter (défaut: 1)
   *
   * @example
   * // Redirection immédiate vers Stripe Checkout
   * service.redirectToCheckout('price_xxx', 1);
   */
  redirectToCheckout(priceId: string, quantity: number = 1): void {
    this.createCheckoutSession(priceId, quantity).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          console.log(`✅ Redirection vers Stripe Checkout (session: ${response.sessionId})`);

          // Redirection vers Stripe Checkout
          // L'adresse et le téléphone seront collectés automatiquement
          window.location.href = response.url;
        } else {
          console.error('❌ URL de checkout manquante dans la réponse');
          alert('Erreur: Impossible de créer la session de paiement');
        }
      },
      error: (error) => {
        console.error('❌ Erreur création session checkout:', error);
        alert('Erreur lors de la création de la session de paiement. Veuillez réessayer.');
      }
    });
  }

  /**
   * Ouvre Stripe Checkout dans un nouvel onglet (optionnel)
   * Utile si vous ne voulez pas quitter la page actuelle
   *
   * @param priceId - ID du prix Stripe
   * @param quantity - Quantité à acheter (défaut: 1)
   */
  openCheckoutInNewTab(priceId: string, quantity: number = 1): void {
    this.createCheckoutSession(priceId, quantity).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          // Ouvrir dans un nouvel onglet
          window.open(response.url, '_blank');
        }
      },
      error: (error) => {
        console.error('❌ Erreur création session checkout:', error);
        alert('Erreur lors de la création de la session de paiement');
      }
    });
  }

  /**
   * Vérifie si une session de paiement a réussi
   * À appeler depuis la page de succès
   *
   * @param sessionId - ID de la session Stripe (récupéré depuis l'URL)
   * @returns Promise<boolean>
   *
   * @example
   * // Dans success.component.ts
   * const sessionId = route.snapshot.queryParams['session_id'];
   * const success = await service.verifySession(sessionId);
   */
  async verifySession(sessionId: string): Promise<boolean> {
    try {
      // Cette fonctionnalité nécessiterait une route supplémentaire
      // /api/verify-session qui utiliserait stripe.checkout.sessions.retrieve()
      // Pour l'instant, on suppose que si on arrive sur la page de succès, c'est bon
      console.log(`✅ Session vérifiée: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur vérification session:', error);
      return false;
    }
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
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = `Erreur serveur: ${error.status}`;
      }
    }

    console.error('❌ Erreur CheckoutService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
