import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';

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
  activeFilter: string = 'all';

  /** Catégories disponibles */
  categories: Category[] = [];

  /** Événement émis lors du clic sur un produit */
  @Output() productSelected = new EventEmitter<Product>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  /**
   * Charge les catégories disponibles
   */
  loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories.filter(cat => cat.active);
    });
  }

  /**
   * Charge tous les produits
   */
  loadProducts(): void {
    // Note: Cette méthode devra être adaptée selon votre ProductService
    // Pour le moment, on utilise une liste vide
    this.allProducts = [];
    this.filteredProducts = this.allProducts;
  }

  /**
   * Applique un filtre par catégorie
   */
  filterByCategory(categorySlug: string): void {
    this.activeFilter = categorySlug;

    if (categorySlug === 'all') {
      this.filteredProducts = this.allProducts;
    } else {
      this.filteredProducts = this.allProducts.filter(
        product => product.categorie === categorySlug
      );
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
