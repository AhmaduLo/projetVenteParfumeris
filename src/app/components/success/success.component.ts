import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    // Récupérer le session_id depuis l'URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    console.log('✅ Paiement réussi! Session ID:', this.sessionId);
  }

  /**
   * Retourner à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
