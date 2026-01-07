import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StripeCartService } from '../../services/stripe-cart.service';
import { AuthService } from '../../services/auth.service';

/**
 * Composant Header avec navigation et menu burger responsive
 */
@Component({
    selector: 'app-header',
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

  /** État d'authentification admin */
  isAdminAuthenticated = false;

  constructor(
    private cartService: StripeCartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner au compteur de panier
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemCount = count;
    });

    // S'abonner à l'état d'authentification admin
    this.authService.currentUser$.subscribe(user => {
      this.isAdminAuthenticated = !!user;
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
   * Navigation vers la page panier
   */
  onCartClick(): void {
    this.router.navigate(['/cart']);
    this.closeMenu();
  }

  /**
   * Toggle le menu mobile
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.toggleBodyScroll();
  }

  /**
   * Ferme le menu mobile
   */
  closeMenu(): void {
    this.menuOpen = false;
    this.enableBodyScroll();
  }

  /**
   * Toggle le scroll du body
   */
  private toggleBodyScroll(): void {
    if (this.menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Active le scroll du body
   */
  private enableBodyScroll(): void {
    document.body.style.overflow = '';
  }

  /**
   * Scroll smooth vers une section
   */
  scrollToSection(sectionId: string): void {
    // Vérifier si on est sur la page d'accueil
    if (this.router.url !== '/' && this.router.url !== '') {
      // Si on n'est pas sur l'accueil, naviguer d'abord vers l'accueil
      this.router.navigate(['/']).then(() => {
        // Attendre un court instant pour que la page se charge
        setTimeout(() => {
          this.scrollToElement(sectionId);
        }, 100);
      });
    } else {
      // Si on est déjà sur l'accueil, scroller directement
      this.scrollToElement(sectionId);
    }
  }

  /**
   * Scroll vers un élément par son ID
   */
  private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
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

  /**
   * Navigation vers la page de login admin
   */
  goToAdminLogin(): void {
    this.router.navigate(['/admin/login']);
    this.closeMenu();
  }

  /**
   * Navigation vers le dashboard admin
   */
  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
    this.closeMenu();
  }
}
