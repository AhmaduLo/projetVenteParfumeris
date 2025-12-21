import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

/**
 * Service de gestion du panier d'achat
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  /** Panier stocké dans localStorage */
  private readonly CART_STORAGE_KEY = 'parfums_cart';

  /** Observable du panier */
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
  public cart$ = this.cartSubject.asObservable();

  /** Observable du nombre total d'articles */
  private cartCountSubject = new BehaviorSubject<number>(this.getTotalItems());
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    // Sauvegarder automatiquement à chaque changement
    this.cart$.subscribe(cart => {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
      this.cartCountSubject.next(this.getTotalItems());
    });
  }

  /**
   * Charge le panier depuis localStorage
   */
  private loadCart(): CartItem[] {
    const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  }

  /**
   * Récupère le panier actuel
   */
  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  /**
   * Ajoute un produit au panier
   */
  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.getCart();
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }

    this.cartSubject.next([...currentCart]);
  }

  /**
   * Met à jour la quantité d'un produit
   */
  updateQuantity(productId: number, quantity: number): void {
    const currentCart = this.getCart();
    const item = currentCart.find(item => item.product.id === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartSubject.next([...currentCart]);
      }
    }
  }

  /**
   * Supprime un produit du panier
   */
  removeFromCart(productId: number): void {
    const currentCart = this.getCart().filter(item => item.product.id !== productId);
    this.cartSubject.next(currentCart);
  }

  /**
   * Vide complètement le panier
   */
  clearCart(): void {
    this.cartSubject.next([]);
  }

  /**
   * Calcule le nombre total d'articles
   */
  getTotalItems(): number {
    return this.getCart().reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Calcule le montant total
   */
  getTotalPrice(): number {
    return this.getCart().reduce((total, item) => {
      return total + (item.product.prix * item.quantity);
    }, 0);
  }

  /**
   * Vérifie si un produit est dans le panier
   */
  isInCart(productId: number): boolean {
    return this.getCart().some(item => item.product.id === productId);
  }

  /**
   * Récupère la quantité d'un produit dans le panier
   */
  getProductQuantity(productId: number): number {
    const item = this.getCart().find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }
}
