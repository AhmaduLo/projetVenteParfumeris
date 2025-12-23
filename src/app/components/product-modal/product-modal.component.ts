import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

/**
 * Composant modal pour afficher les détails d'un produit
 */
@Component({
    selector: 'app-product-modal',
    imports: [CommonModule],
    templateUrl: './product-modal.component.html',
    styleUrls: ['./product-modal.component.scss']
})
export class ProductModalComponent implements OnChanges {
  /** Produit à afficher (null = modal fermé) */
  @Input() product: Product | null = null;

  /** Masquer les boutons d'action (pour panier et commandes) */
  @Input() hideActions = false;

  /** Événement de fermeture du modal */
  @Output() closeModal = new EventEmitter<void>();

  /** Événement d'ouverture du modal de contact */
  @Output() openContact = new EventEmitter<Product>();

  /** État d'animation du modal */
  isAnimating = false;

  /** Quantité à ajouter au panier */
  quantity = 1;

  /** Message de confirmation d'ajout */
  addedToCartMessage = false;

  constructor(private cartService: CartService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.isAnimating = true;
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
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.addedToCartMessage = true;

      // Masquer le message après 2 secondes
      setTimeout(() => {
        this.addedToCartMessage = false;
      }, 2000);
    }
  }

  /**
   * Retourne le label de catégorie formaté
   */
  getCategoryLabel(): string {
    return this.product?.categorie === 'parfum' ? 'Parfum' : 'Encens';
  }
}
