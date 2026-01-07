import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StripeCartService, StripeCartItem } from '../../services/stripe-cart.service';
import { StripeCheckoutService } from '../../services/stripe-checkout.service';
import { NotificationService } from '../../services/notification.service';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { Product } from '../../models/product.model';

/**
 * Composant page panier avec checkout Stripe
 */
@Component({
    selector: 'app-cart',
    imports: [CommonModule, ProductModalComponent],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  /** Articles du panier */
  cartItems: StripeCartItem[] = [];

  /** Montant total */
  totalPrice = 0;

  /** État de chargement du paiement */
  isProcessing = false;

  /** Message d'erreur */
  errorMessage = '';

  /** Produit sélectionné pour le modal */
  selectedProduct: Product | null = null;

  constructor(
    private cartService: StripeCartService,
    private checkoutService: StripeCheckoutService,
    private router: Router,
    private notificationService: NotificationService
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
      this.totalPrice = this.cartService.getTotalPrice(); // price.amount is already in euros
    });
  }

  /**
   * Met à jour la quantité d'un article
   */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity >= 1) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  /**
   * Supprime un article du panier
   */
  removeItem(productId: string): void {
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
   * Procéder au paiement Stripe Checkout pour tous les produits du panier
   */
  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Votre panier est vide';
      return;
    }

    // Vérifier que tous les produits ont un prix
    const invalidItems = this.cartItems.filter(item => !item.product.price);
    if (invalidItems.length > 0) {
      this.errorMessage = 'Certains produits n\'ont pas de prix configuré';
      return;
    }

    // Construire le tableau d'items pour Stripe
    const checkoutItems = this.cartItems.map(item => ({
      priceId: item.product.price!.id,
      quantity: item.quantity
    }));


    // Rediriger vers Stripe Checkout avec tous les produits
    this.checkoutService.redirectToCartCheckout(checkoutItems);
  }

  /**
   * Commander via WhatsApp
   */
  checkoutViaWhatsApp(): void {
    if (this.cartItems.length === 0) {
      this.notificationService.warning('Votre panier est vide');
      return;
    }

    let message = 'Bonjour! Je souhaite commander:\n\n';

    this.cartItems.forEach(item => {
      message += `${item.quantity}x ${item.product.name} - ${item.product.price?.formatted}\n`;
    });

    message += `\nTotal: ${this.totalPrice.toFixed(2)}€`;

    const phoneNumber = '33123456789'; // TODO: Mettre le vrai numéro
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  }

  /**
   * Commander par Email
   */
  checkoutViaEmail(): void {
    if (this.cartItems.length === 0) {
      this.notificationService.warning('Votre panier est vide');
      return;
    }

    let body = 'Bonjour,%0D%0A%0D%0AJe souhaite commander:%0D%0A%0D%0A';

    this.cartItems.forEach(item => {
      body += `${item.quantity}x ${item.product.name} - ${item.product.price?.formatted}%0D%0A`;
    });

    body += `%0D%0ATotal: ${this.totalPrice.toFixed(2)}€%0D%0A%0D%0AMerci!`;

    const email = 'contact@example.com'; // TODO: Mettre le vrai email
    window.location.href = `mailto:${email}?subject=Commande&body=${body}`;
  }

  /**
   * Retour à la page d'accueil
   */
  goBack(): void {
    this.router.navigate(['/']);
  }

  /**
   * Tracking pour ngFor
   */
  trackByCartItem(_index: number, item: StripeCartItem): string {
    return item.product.id;
  }

  /**
   * Récupère l'image d'un produit
   */
  getProductImage(item: StripeCartItem): string {
    return item.product.images && item.product.images.length > 0
      ? item.product.images[0]
      : 'assets/images/placeholder.jpg';
  }

  /**
   * Ouvre le modal avec les détails du produit
   */
  openProductModal(item: StripeCartItem): void {
    this.selectedProduct = this.convertStripeProductToLocal(item.product);
  }

  /**
   * Ferme le modal
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Convertit un produit Stripe en modèle Product local
   */
  private convertStripeProductToLocal(stripeProduct: any): Product {
    const metadata = stripeProduct.metadata || {};

    const product: Product = {
      id: parseInt(metadata['id'] || '0'),
      nom: stripeProduct.name || 'Produit sans nom',
      categorie: metadata['category'] === 'parfum' ? 'parfum' : 'incense',
      prix: stripeProduct.price?.amount || 0,
      image: (stripeProduct.images && stripeProduct.images.length > 0)
        ? stripeProduct.images[0]
        : 'assets/images/placeholder.jpg',
      description: stripeProduct.description || 'Aucune description disponible',
      caracteristiques: {
        // Gérer les espaces et accents dans les clés Stripe
        contenance: metadata['contenance'] || metadata['contenance '],
        origine: metadata['origine'] || metadata['origine '] || 'Non spécifié',
        notes: metadata['notes'] || metadata['notes '],
        duree: metadata['duree'] || metadata['durée'] || metadata['durée ']
      },
      nouveau: metadata['nouveau'] === 'true' || metadata['featured'] === 'true' || metadata['featured '] === 'true'
    };

    return product;
  }
}
