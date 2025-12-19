import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';

/**
 * Composant carte produit avec effet hover
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  /** Produit à afficher */
  @Input() product!: Product;

  /** Événement émis lors du clic sur la carte */
  @Output() productClick = new EventEmitter<Product>();

  /**
   * Gère le clic sur la carte
   */
  onCardClick(): void {
    this.productClick.emit(this.product);
  }

  /**
   * Retourne le label de catégorie formaté
   */
  getCategoryLabel(): string {
    return this.product.categorie === 'parfum' ? 'Parfum' : 'Encens';
  }
}
