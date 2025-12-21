import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { StripeProductListComponent } from '../stripe-product-list/stripe-product-list.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ContactModalComponent } from '../contact-modal/contact-modal.component';
import { AboutComponent } from '../about/about.component';
import { Product } from '../../models/product.model';

/**
 * Composant de la page d'accueil
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    StripeProductListComponent,
    ProductModalComponent,
    ContactModalComponent,
    AboutComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  /** Produit sélectionné pour le modal */
  selectedProduct: Product | null = null;

  /** État d'ouverture du modal de contact */
  isContactModalOpen = false;

  /** Produit pour le modal de contact */
  contactProduct?: Product;

  /**
   * Gère la sélection d'un produit
   */
  onProductSelected(product: Product): void {
    this.selectedProduct = product;
  }

  /**
   * Ferme le modal produit
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Ouvre le modal de contact
   */
  openContactModal(product?: Product): void {
    this.contactProduct = product;
    this.isContactModalOpen = true;
  }

  /**
   * Ferme le modal de contact
   */
  closeContactModal(): void {
    this.isContactModalOpen = false;
    this.contactProduct = undefined;
  }
}
