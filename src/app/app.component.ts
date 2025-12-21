import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CartComponent } from './components/cart/cart.component';

/**
 * Composant principal de l'application
 */
@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterOutlet,
        HeaderComponent,
        FooterComponent,
        CartComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /** État d'ouverture du panier */
  isCartOpen = false;

  /**
   * Ouvre le panier
   */
  openCart(): void {
    this.isCartOpen = true;
  }

  /**
   * Ferme le panier
   */
  closeCart(): void {
    this.isCartOpen = false;
  }
}
