import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { StripeService } from '../../services/stripe.service';
import { ProductService } from '../../services/product.service';
import { CartItem } from '../../models/product.model';

/**
 * Composant panier avec checkout Stripe (sans backend)
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  /** État d'ouverture du panier */
  @Input() isOpen = false;

  /** Événement de fermeture */
  @Output() closeCart = new EventEmitter<void>();

  /** Articles du panier */
  cartItems: CartItem[] = [];

  /** Montant total */
  totalPrice = 0;

  /** État de chargement du paiement */
  isProcessing = false;

  /** Message d'erreur */
  errorMessage = '';

  constructor(
    private cartService: CartService,
    private stripeService: StripeService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  /**
   * Charge le panier
   */
  loadCart(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  /**
   * Met à jour la quantité d'un article
   */
  updateQuantity(productId: number, quantity: number): void {
    if (quantity >= 1) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  /**
   * Supprime un article du panier
   */
  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  /**
   * Vide le panier
   */
  clearCart(): void {
    if (confirm('Voulez-vous vraiment vider le panier ?')) {
      this.cartService.clearCart();
    }
  }

  /**
   * Paiement Stripe (un seul produit à la fois avec Payment Links)
   * Si le panier contient plusieurs produits, on guide vers WhatsApp/Email
   */
  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Votre panier est vide';
      return;
    }

    // Si un seul produit et qu'il a un Payment Link configuré
    if (this.cartItems.length === 1) {
      const item = this.cartItems[0];
      if (this.stripeService.hasPaymentLink(item.product.id)) {
        this.stripeService.checkoutSingleProduct(item.product.id, item.quantity);
        return;
      }
    }

    // Sinon, proposer WhatsApp ou Email
    this.errorMessage = 'Pour commander plusieurs produits, utilisez WhatsApp ou Email ci-dessous.';
  }

  /**
   * Commander via WhatsApp
   */
  checkoutViaWhatsApp(): void {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Votre panier est vide';
      return;
    }

    const contactInfo = this.productService.getContactInfo();
    this.stripeService.checkoutViaWhatsApp(this.cartItems, contactInfo.whatsapp);
  }

  /**
   * Commander via Email
   */
  checkoutViaEmail(): void {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Votre panier est vide';
      return;
    }

    const contactInfo = this.productService.getContactInfo();
    this.stripeService.checkoutViaEmail(this.cartItems, contactInfo.email);
  }

  /**
   * Ferme le panier
   */
  close(): void {
    this.closeCart.emit();
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
   * Tracking pour ngFor
   */
  trackByCartItem(index: number, item: CartItem): number {
    return item.product.id;
  }
}
