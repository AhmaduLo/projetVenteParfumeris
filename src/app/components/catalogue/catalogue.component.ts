import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

/**
 * Composant catalogue avec filtrage par catégorie
 */
@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss']
})
export class CatalogueComponent implements OnInit {
  /** Liste complète des produits */
  allProducts: Product[] = [];

  /** Liste filtrée des produits affichés */
  filteredProducts: Product[] = [];

  /** Filtre actif */
  activeFilter: 'all' | 'parfum' | 'incense' = 'all';

  /** Événement émis lors du clic sur un produit */
  @Output() productSelected = new EventEmitter<Product>();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Charge tous les produits
   */
  loadProducts(): void {
    this.allProducts = this.productService.getAllProducts();
    this.filteredProducts = this.allProducts;
  }

  /**
   * Applique un filtre par catégorie
   */
  filterByCategory(category: 'all' | 'parfum' | 'incense'): void {
    this.activeFilter = category;

    if (category === 'all') {
      this.filteredProducts = this.allProducts;
    } else {
      this.filteredProducts = this.productService.getProductsByCategory(category);
    }
  }

  /**
   * Gère le clic sur une carte produit
   */
  onProductClick(product: Product): void {
    this.productSelected.emit(product);
  }

  /**
   * Retourne le nombre de produits affichés
   */
  getProductCount(): number {
    return this.filteredProducts.length;
  }

  /**
   * Fonction de tracking pour ngFor (optimisation des performances)
   */
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
