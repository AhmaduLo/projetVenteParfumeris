import { Component, HostListener, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StripeCartService } from '../../services/stripe-cart.service';

/**
 * Composant Header avec navigation et menu burger responsive
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  /** État du menu mobile */
  menuOpen = false;

  /** État du header sticky */
  isSticky = false;

  /** Nombre d'articles dans le panier */
  cartItemCount = 0;

  /** Événement d'ouverture du panier */
  @Output() openCart = new EventEmitter<void>();

  constructor(
    private cartService: StripeCartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner au compteur de panier
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemCount = count;
    });
  }

  /**
   * Détecte le scroll pour appliquer l'effet sticky
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isSticky = window.scrollY > 50;
  }

  /**
   * Ouvre le panier
   */
  onCartClick(): void {
    this.openCart.emit();
  }

  /**
   * Toggle le menu mobile
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Ferme le menu mobile
   */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /**
   * Scroll smooth vers une section
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.closeMenu();
    }
  }

  /**
   * Navigation vers la page des commandes
   */
  goToOrders(): void {
    this.router.navigate(['/orders']);
    this.closeMenu();
  }
}
