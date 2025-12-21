import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeCartService } from '../../services/stripe-cart.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: StripeCartService
  ) {}

  ngOnInit(): void {
    // Récupérer le session_id depuis l'URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    console.log('✅ Paiement réussi! Session ID:', this.sessionId);

    // Vider le panier après un paiement réussi
    if (this.sessionId) {
      console.log('🗑️ Vidage du panier après paiement réussi');
      this.cartService.clearCart();
    }
  }

  /**
   * Retourner à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
