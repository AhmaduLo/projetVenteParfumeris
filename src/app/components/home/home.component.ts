import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { StripeProductListComponent } from '../stripe-product-list/stripe-product-list.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ContactModalComponent } from '../contact-modal/contact-modal.component';
import { AboutComponent } from '../about/about.component';
import { Product } from '../../models/product.model';
import { StripeProduct } from '../../models/stripe-product.model';

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
   * Gère la sélection d'un produit (converti depuis StripeProduct)
   */
  onProductSelected(stripeProduct: StripeProduct): void {
    console.log('🔍 Produit sélectionné:', stripeProduct);

    // Convertir StripeProduct en Product pour le modal
    const product: Product = {
      id: parseInt(stripeProduct.id.replace('prod_', ''), 36), // Conversion ID string → number
      nom: stripeProduct.name,
      description: stripeProduct.description,
      prix: stripeProduct.price?.amount || 0,
      image: stripeProduct.images[0] || '/assets/default-product.jpg',
      categorie: (stripeProduct.metadata['category'] as 'parfum' | 'incense') || 'parfum',
      caracteristiques: {
        contenance: stripeProduct.metadata['contenance'] || undefined,
        origine: stripeProduct.metadata['origine'] || 'Non spécifié',
        notes: stripeProduct.metadata['notes'] || undefined,
        duree: stripeProduct.metadata['duree'] || undefined
      },
      nouveau: stripeProduct.metadata['featured'] === 'true' || false
    };

    console.log('✅ Produit converti:', product);
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
