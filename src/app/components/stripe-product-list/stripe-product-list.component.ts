import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StripeProduct } from '../../models/stripe-product.model';
import { StripeProductService } from '../../services/stripe-product.service';
import { StripeCheckoutService } from '../../services/stripe-checkout.service';
import { StripeCartService } from '../../services/stripe-cart.service';
import { NotificationService } from '../../services/notification.service';
import { StripeProductModalComponent } from '../stripe-product-modal/stripe-product-modal.component';

/**
 * Composant d'affichage de la liste des produits Stripe
 *
 * Ce composant :
 * - Récupère automatiquement les produits depuis Stripe via l'API Vercel
 * - Affiche les produits en grille responsive
 * - Permet d'acheter directement via Stripe Checkout
 * - Collecte automatiquement l'adresse et le téléphone du client
 */
@Component({
    selector: 'app-stripe-product-list',
    imports: [CommonModule, FormsModule, StripeProductModalComponent],
    templateUrl: './stripe-product-list.component.html',
    styleUrls: ['./stripe-product-list.component.scss']
})
export class StripeProductListComponent implements OnInit {
  /** Liste complète des produits */
  products: StripeProduct[] = [];

  /** Produits filtrés (pour la recherche) */
  filteredProducts: StripeProduct[] = [];

  /** Indique si les produits sont en cours de chargement */
  loading = true;

  /** Message d'erreur */
  error: string | null = null;

  /** Terme de recherche */
  searchTerm = '';

  /** Filtre par catégorie */
  selectedCategory: string | null = null;

  /** Liste des catégories disponibles */
  categories: string[] = [];

  /** Tri par prix */
  sortOrder: 'asc' | 'desc' | null = null;

  /** Événement émis lors du clic sur un produit pour ouvrir le modal */
  @Output() productSelected = new EventEmitter<StripeProduct>();

  /** Produit sélectionné pour le modal */
  selectedProduct: StripeProduct | null = null;

  constructor(
    private productService: StripeProductService,
    private checkoutService: StripeCheckoutService,
    private cartService: StripeCartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Charge les produits depuis Stripe via l'API Vercel
   */
  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.loadProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.extractCategories();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Impossible de charger les produits. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  /**
   * Extrait les catégories uniques des produits
   */
  private extractCategories(): void {
    const categorySet = new Set<string>();

    this.products.forEach(product => {
      const category = product.metadata['category'];
      if (category) {
        categorySet.add(category);
      }
    });

    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Ajoute un produit au panier
   */
  addToCart(product: StripeProduct): void {
    if (!product.price) {
      this.notificationService.warning('Ce produit n\'a pas de prix configuré');
      return;
    }

    this.cartService.addToCart(product, 1);

    // Afficher une notification de succès
    this.notificationService.success(`${product.name} ajouté au panier!`);
  }

  /**
   * Acheter un produit → Redirige vers Stripe Checkout
   * L'adresse et le téléphone seront collectés automatiquement par Stripe
   */
  buyProduct(product: StripeProduct, quantity: number = 1): void {
    if (!product.price) {
      this.notificationService.warning('Ce produit n\'a pas de prix configuré');
      return;
    }

    // Redirection vers Stripe Checkout
    // La collecte d'adresse et téléphone est configurée dans api/checkout.ts
    this.checkoutService.redirectToCheckout(product.price.id, quantity);
  }

  /**
   * Recherche de produits
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Filtre par catégorie
   */
  filterByCategory(category: string | null): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Tri par prix
   */
  sortByPrice(order: 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.applyFilters();
  }

  /**
   * Applique tous les filtres
   */
  private applyFilters(): void {
    let filtered = [...this.products];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter(p =>
        p.metadata['category'] === this.selectedCategory
      );
    }

    // Tri par prix
    if (this.sortOrder) {
      filtered.sort((a, b) => {
        const priceA = a.price?.amount || 0;
        const priceB = b.price?.amount || 0;
        return this.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    this.filteredProducts = filtered;
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.sortOrder = null;
    this.filteredProducts = [...this.products];
  }

  /**
   * Vérifie si un produit a une image
   */
  hasImage(product: StripeProduct): boolean {
    return this.productService.hasImage(product);
  }

  /**
   * Récupère l'image du produit ou une image par défaut
   */
  getProductImage(product: StripeProduct): string {
    return this.productService.getProductImage(product);
  }

  /**
   * Vérifie si un produit est en stock
   */
  isInStock(product: StripeProduct): boolean {
    const stock = product.metadata['stock'];
    if (!stock) return true; // Pas de gestion de stock = toujours disponible
    return parseInt(stock, 10) > 0;
  }

  /**
   * Récupère le stock d'un produit
   */
  getStock(product: StripeProduct): number | null {
    const stock = product.metadata['stock'];
    return stock ? parseInt(stock, 10) : null;
  }

  /**
   * Vérifie si un produit est mis en avant
   */
  isFeatured(product: StripeProduct): boolean {
    return product.metadata['featured'] === 'true';
  }

  /**
   * TrackBy pour optimiser ngFor
   */
  trackByProductId(index: number, product: StripeProduct): string {
    return product.id;
  }

  /**
   * Ouvre le modal de détails du produit
   */
  openProductModal(product: StripeProduct): void {
    this.selectedProduct = product;
    this.productSelected.emit(product);
  }

  /**
   * Ferme le modal de produit
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Ouvre le modal de contact pour un produit spécifique
   */
  openContactModal(product: StripeProduct): void {
    // TODO: Implémenter le modal de contact
    this.notificationService.info(`Fonctionnalité de contact pour ${product.name} - À implémenter`);
  }
}
