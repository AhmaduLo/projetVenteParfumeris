import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';

/**
 * Composant modal pour afficher les détails d'un produit
 */
@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss']
})
export class ProductModalComponent implements OnChanges {
  /** Produit à afficher (null = modal fermé) */
  @Input() product: Product | null = null;

  /** Événement de fermeture du modal */
  @Output() closeModal = new EventEmitter<void>();

  /** Événement d'ouverture du modal de contact */
  @Output() openContact = new EventEmitter<Product>();

  /** État d'animation du modal */
  isAnimating = false;

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
   * Retourne le label de catégorie formaté
   */
  getCategoryLabel(): string {
    return this.product?.categorie === 'parfum' ? 'Parfum' : 'Encens';
  }
}
