import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Page d'annulation de paiement Stripe
 * Affichée quand l'utilisateur annule le checkout
 */
@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.scss'
})
export class CancelComponent {
  constructor(private router: Router) {}

  /**
   * Retourner à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
