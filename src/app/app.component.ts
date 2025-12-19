import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { CatalogueComponent } from './components/catalogue/catalogue.component';
import { ProductModalComponent } from './components/product-modal/product-modal.component';
import { ContactModalComponent } from './components/contact-modal/contact-modal.component';
import { AboutComponent } from './components/about/about.component';
import { FooterComponent } from './components/footer/footer.component';
import { Product } from './models/product.model';

/**
 * Composant principal de l'application
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeroComponent,
    CatalogueComponent,
    ProductModalComponent,
    ContactModalComponent,
    AboutComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
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
