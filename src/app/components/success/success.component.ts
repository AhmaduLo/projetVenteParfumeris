import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeCartService } from '../../services/stripe-cart.service';
import { OrderService } from '../../services/order.service';

/**
 * Page de succès après paiement Stripe
 * Affichée après redirection depuis Stripe Checkout
 */
@Component({
    selector: 'app-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './success.component.html',
    styleUrl: './success.component.scss'
})
export class SuccessComponent implements OnInit {
  sessionId: string | null = null;
  orderNumber: string | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: StripeCartService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Récupérer le session_id depuis l'URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (this.sessionId) {
      // Vider le panier
      this.cartService.clearCart();

      // Enregistrer la commande dans l'historique
      this.orderService.fetchOrderDetails(this.sessionId).subscribe({
        next: (response: any) => {
          // Récupérer le numéro de commande depuis la réponse
          this.orderNumber = response.orderNumber || this.sessionId;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Erreur enregistrement commande:', err);
          this.error = 'Impossible de récupérer les détails de la commande';
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
      this.error = 'Aucun ID de session fourni';
    }
  }

  /**
   * Retourner à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Voir mes commandes
   */
  viewOrders(): void {
    this.router.navigate(['/orders']);
  }
}
