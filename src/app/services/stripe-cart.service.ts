import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StripeProduct } from '../models/stripe-product.model';

export interface StripeCartItem {
  product: StripeProduct;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class StripeCartService {
  private readonly CART_STORAGE_KEY = 'stripe_cart';

  private cartSubject = new BehaviorSubject<StripeCartItem[]>(this.loadCart());
  public cart$ = this.cartSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(this.getTotalItems());
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    this.cart$.subscribe(cart => {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
      this.cartCountSubject.next(this.getTotalItems());
    });
  }

  private loadCart(): StripeCartItem[] {
    const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  }

  getCart(): StripeCartItem[] {
    return this.cartSubject.value;
  }

  addToCart(product: StripeProduct, quantity: number = 1): void {
    const currentCart = this.getCart();
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }

    this.cartSubject.next([...currentCart]);
  }

  updateQuantity(productId: string, quantity: number): void {
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

  removeFromCart(productId: string): void {
    const currentCart = this.getCart().filter(item => item.product.id !== productId);
    this.cartSubject.next(currentCart);
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  getTotalItems(): number {
    return this.getCart().reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.getCart().reduce((total, item) => {
      const price = item.product.price?.amount || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  isInCart(productId: string): boolean {
    return this.getCart().some(item => item.product.id === productId);
  }

  getProductQuantity(productId: string): number {
    const item = this.getCart().find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }
}
