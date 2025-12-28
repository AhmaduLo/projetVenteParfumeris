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

  /** Index de l'image actuellement affichée */
  currentImageIndex = 0;

  /** État du zoom */
  isZoomed = false;

  /** Position de départ du swipe */
  private touchStartX = 0;

  /** Position actuelle du swipe */
  private touchCurrentX = 0;

  /** Indique si un swipe est en cours */
  private isSwiping = false;

  constructor(private cartService: StripeCartService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.isAnimating = true;
      this.quantity = 1; // Réinitialiser la quantité
      this.currentImageIndex = 0; // Réinitialiser l'index d'image
      this.isZoomed = false; // Réinitialiser le zoom
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

    // Exclure les métadonnées utilisées pour d'autres usages
    const excludedKeys = ['category', 'featured'];
    const metadataKeys = Object.keys(this.product.metadata || {});

    return metadataKeys.some(key => !excludedKeys.includes(key.trim().toLowerCase()));
  }

  /**
   * Retourne la liste des caractéristiques à afficher
   * Génère automatiquement les labels en capitalisant les clés
   */
  getCharacteristics(): Array<{ label: string; value: string }> {
    if (!this.product || !this.product.metadata) return [];

    // Clés à exclure de l'affichage (utilisées pour d'autres usages)
    const excludedKeys = ['category', 'featured'];

    // Mapping des clés vers des labels français
    const labelMapping: { [key: string]: string } = {
      'contenance': 'Contenance',
      'origine': 'Origine',
      'notes': 'Notes',
      'duree': 'Durée',
      'durée': 'Durée',
      'saveur': 'Saveur'
    };

    const characteristics: Array<{ label: string; value: string }> = [];

    // Parcourir toutes les métadonnées
    Object.keys(this.product.metadata).forEach(key => {
      const trimmedKey = key.trim().toLowerCase();

      // Ignorer les clés exclues
      if (excludedKeys.includes(trimmedKey)) {
        return;
      }

      const value = this.product!.metadata[key];

      // Ignorer les valeurs vides
      if (!value || value.trim() === '') {
        return;
      }

      // Utiliser le mapping si disponible, sinon capitaliser la clé
      const label = labelMapping[trimmedKey] || this.capitalizeFirst(trimmedKey);

      characteristics.push({ label, value });
    });

    return characteristics;
  }

  /**
   * Capitalise la première lettre d'une chaîne
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ===== SLIDER METHODS =====

  /**
   * Retourne le nombre d'images du produit
   */
  getImagesCount(): number {
    return this.product?.images?.length || 0;
  }

  /**
   * Retourne l'image actuelle
   */
  getCurrentImage(): string {
    if (!this.product || !this.product.images || this.product.images.length === 0) {
      return 'assets/images/placeholder.jpg';
    }
    return this.product.images[this.currentImageIndex] || this.product.images[0];
  }

  /**
   * Passe à l'image suivante
   */
  nextImage(): void {
    if (!this.product || !this.product.images) return;

    if (this.currentImageIndex < this.product.images.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0; // Boucle au début
    }
    this.isZoomed = false; // Désactive le zoom lors du changement d'image
  }

  /**
   * Passe à l'image précédente
   */
  previousImage(): void {
    if (!this.product || !this.product.images) return;

    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.product.images.length - 1; // Boucle à la fin
    }
    this.isZoomed = false; // Désactive le zoom lors du changement d'image
  }

  /**
   * Va à une image spécifique
   */
  goToImage(index: number): void {
    if (!this.product || !this.product.images) return;

    if (index >= 0 && index < this.product.images.length) {
      this.currentImageIndex = index;
      this.isZoomed = false;
    }
  }

  /**
   * Toggle le zoom de l'image
   */
  toggleZoom(): void {
    this.isZoomed = !this.isZoomed;
  }

  // ===== SWIPE GESTURES =====

  /**
   * Début du swipe (touch)
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
    this.isSwiping = true;
  }

  /**
   * Mouvement du swipe (touch)
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping) return;
    this.touchCurrentX = event.touches[0].clientX;
  }

  /**
   * Fin du swipe (touch)
   */
  onTouchEnd(): void {
    if (!this.isSwiping) return;

    const diff = this.touchStartX - this.touchCurrentX;
    const threshold = 50; // Distance minimale pour déclencher le swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe vers la gauche -> image suivante
        this.nextImage();
      } else {
        // Swipe vers la droite -> image précédente
        this.previousImage();
      }
    }

    this.isSwiping = false;
    this.touchStartX = 0;
    this.touchCurrentX = 0;
  }

  /**
   * Empêche la propagation du clic sur l'image (pour ne pas fermer le modal)
   */
  onImageClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleZoom();
  }

  /**
   * Empêche la propagation du clic sur les flèches
   */
  onArrowClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
