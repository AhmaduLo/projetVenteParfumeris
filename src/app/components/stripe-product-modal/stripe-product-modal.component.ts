import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripeProduct } from '../../models/stripe-product.model';
import { StripeCartService } from '../../services/stripe-cart.service';

/**
 * Composant modal pour afficher les détails d'un produit Stripe
 */
@Component({
  selector: 'app-stripe-product-modal',
  imports: [CommonModule],
  templateUrl: './stripe-product-modal.component.html',
  styleUrls: ['./stripe-product-modal.component.scss']
})
export class StripeProductModalComponent implements OnChanges {
  /** Produit à afficher (null = modal fermé) */
  @Input() product: StripeProduct | null = null;

  /** Événement de fermeture du modal */
  @Output() closeModal = new EventEmitter<void>();

  /** Événement d'ouverture du modal de contact */
  @Output() openContact = new EventEmitter<StripeProduct>();

  /** État d'animation du modal */
  isAnimating = false;

  /** Quantité à ajouter au panier */
  quantity = 1;

  /** Message de confirmation d'ajout */
  addedToCartMessage = false;

  constructor(private cartService: StripeCartService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.isAnimating = true;
      this.quantity = 1; // Réinitialiser la quantité
      // Empêcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';
    } else if (changes['product'] && !this.product) {
      // Réactiver le scroll du body quand le modal est fermé
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Ferme le modal
   */
  close(): void {
    this.isAnimating = false;
    setTimeout(() => {
      this.closeModal.emit();
      document.body.style.overflow = 'auto';
    }, 300);
  }

  /**
   * Gère le clic sur l'overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /**
   * Ouvre le modal de contact avec le produit
   */
  contactForProduct(): void {
    if (this.product) {
      this.openContact.emit(this.product);
      this.close();
    }
  }

  /**
   * Augmente la quantité
   */
  increaseQuantity(): void {
    this.quantity++;
  }

  /**
   * Diminue la quantité
   */
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Ajoute le produit au panier
   */
  addToCart(): void {
    if (this.product && this.product.price) {
      this.cartService.addToCart(this.product, this.quantity);
      this.addedToCartMessage = true;

      // Masquer le message après 2 secondes
      setTimeout(() => {
        this.addedToCartMessage = false;
        // Réinitialiser la quantité après l'ajout
        this.quantity = 1;
      }, 2000);
    }
  }

  /**
   * Retourne le label de catégorie formaté
   */
  getCategoryLabel(): string {
    const category = this.product?.metadata['category'];
    if (category === 'parfum' || category === 'PARFUM') {
      return 'PARFUM';
    } else if (category === 'encens' || category === 'ENCENS' || category === 'incense') {
      return 'ENCENS';
    }
    return category?.toUpperCase() || 'PRODUIT';
  }

  /**
   * Vérifie si le produit a des caractéristiques à afficher
   */
  hasCharacteristics(): boolean {
    if (!this.product) return false;

    return !!(
      this.product.metadata['contenance'] ||
      this.product.metadata['contenance '] ||
      this.product.metadata['origine'] ||
      this.product.metadata['origine '] ||
      this.product.metadata['notes'] ||
      this.product.metadata['notes '] ||
      this.product.metadata['duree'] ||
      this.product.metadata['durée'] ||
      this.product.metadata['durée ']
    );
  }
}
