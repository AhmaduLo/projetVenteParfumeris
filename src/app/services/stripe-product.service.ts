import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { StripeProduct, ProductsResponse } from '../models/stripe-product.model';
import { environment } from '../../environments/environment';

/**
 * Service de gestion des produits Stripe
 *
 * Ce service :
 * - Récupère les produits depuis l'API Vercel (/api/products)
 * - Met en cache les produits pour éviter les appels répétés
 * - Fournit des méthodes de filtrage et de recherche
 *
 * IMPORTANT :
 * - Ne jamais appeler Stripe directement depuis Angular
 * - Toujours passer par l'API Vercel qui protège la clé secrète
 */
@Injectable({
  providedIn: 'root'
})
export class StripeProductService {
  /** URL de l'API Vercel */
  private apiUrl = environment.apiUrl;

  /** Cache des produits pour éviter les appels répétés */
  private productsSubject = new BehaviorSubject<StripeProduct[]>([]);

  /** Observable public des produits (avec cache) */
  public products$ = this.productsSubject.asObservable();

  /** Indique si les produits sont en cours de chargement */
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /** Stocke la dernière erreur */
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les produits depuis l'API Vercel
   * Les produits sont mis en cache dans productsSubject
   *
   * @returns Observable<StripeProduct[]>
   */
  loadProducts(): Observable<StripeProduct[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<ProductsResponse>(`${this.apiUrl}/products`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Erreur lors de la récupération des produits');
        }
        return response.products;
      }),
      tap(products => {
        // Mettre à jour le cache
        this.productsSubject.next(products);
        this.loadingSubject.next(false);
        console.log(`✅ ${products.length} produits chargés depuis Stripe`);
      }),
      catchError(error => {
        this.handleError(error);
        this.loadingSubject.next(false);
        return throwError(() => error);
      }),
      shareReplay(1) // Partager le résultat entre plusieurs souscriptions
    );
  }

  /**
   * Récupère un produit par son ID
   *
   * @param id - ID du produit Stripe
   * @returns Observable<StripeProduct | undefined>
   */
  getProductById(id: string): Observable<StripeProduct | undefined> {
    return this.products$.pipe(
      map(products => products.find(p => p.id === id))
    );
  }

  /**
   * Filtre les produits par métadonnée
   * Utile pour filtrer par catégorie, tags, etc.
   *
   * @param key - Clé de la métadonnée
   * @param value - Valeur recherchée
   * @returns Observable<StripeProduct[]>
   *
   * @example
   * // Filtrer par catégorie "parfum"
   * service.getProductsByMetadata('category', 'parfum')
   */
  getProductsByMetadata(key: string, value: string): Observable<StripeProduct[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.metadata[key] === value))
    );
  }

  /**
   * Récupère les produits mis en avant (featured)
   * Basé sur la métadonnée "featured" = "true"
   *
   * @returns Observable<StripeProduct[]>
   */
  getFeaturedProducts(): Observable<StripeProduct[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.metadata['featured'] === 'true'))
    );
  }

  /**
   * Filtre les produits par recherche textuelle
   * Recherche dans le nom et la description
   *
   * @param searchTerm - Terme de recherche
   * @returns Observable<StripeProduct[]>
   */
  searchProducts(searchTerm: string): Observable<StripeProduct[]> {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      return this.products$;
    }

    return this.products$.pipe(
      map(products =>
        products.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        )
      )
    );
  }

  /**
   * Trie les produits par prix (croissant ou décroissant)
   *
   * @param order - 'asc' pour croissant, 'desc' pour décroissant
   * @returns Observable<StripeProduct[]>
   */
  sortByPrice(order: 'asc' | 'desc' = 'asc'): Observable<StripeProduct[]> {
    return this.products$.pipe(
      map(products => {
        const sorted = [...products].sort((a, b) => {
          const priceA = a.price?.amount || 0;
          const priceB = b.price?.amount || 0;
          return order === 'asc' ? priceA - priceB : priceB - priceA;
        });
        return sorted;
      })
    );
  }

  /**
   * Récupère les produits disponibles (avec stock > 0)
   * Basé sur la métadonnée "stock"
   *
   * @returns Observable<StripeProduct[]>
   */
  getAvailableProducts(): Observable<StripeProduct[]> {
    return this.products$.pipe(
      map(products =>
        products.filter(p => {
          const stock = p.metadata['stock'];
          return !stock || parseInt(stock, 10) > 0;
        })
      )
    );
  }

  /**
   * Rafraîchir les produits depuis l'API
   * Force un nouveau chargement
   */
  refresh(): void {
    this.loadProducts().subscribe();
  }

  /**
   * Vérifier si un produit a une image
   */
  hasImage(product: StripeProduct): boolean {
    return product.images && product.images.length > 0;
  }

  /**
   * Récupère la première image ou une image par défaut
   * Optimise l'URL Stripe pour la haute qualité
   */
  getProductImage(product: StripeProduct, defaultImage: string = 'assets/images/placeholder.jpg', highQuality: boolean = false): string {
    if (!this.hasImage(product)) {
      return defaultImage;
    }

    let imageUrl = product.images[0];

    // Pour les images Stripe, ajouter un paramètre de qualité si supporté
    if (highQuality && imageUrl.includes('files.stripe.com')) {
      // Stripe supporte des paramètres de redimensionnement
      // On ne modifie pas l'URL pour garder la qualité originale
      return imageUrl;
    }

    return imageUrl;
  }

  /**
   * Récupère l'image en haute résolution pour le modal
   */
  getHighQualityImage(product: StripeProduct, defaultImage: string = 'assets/images/placeholder.jpg'): string {
    return this.getProductImage(product, defaultImage, true);
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = error.error?.error || `Erreur serveur: ${error.status}`;
    }

    this.errorSubject.next(errorMessage);
    console.error('❌ Erreur ProductService:', errorMessage);
  }
}
