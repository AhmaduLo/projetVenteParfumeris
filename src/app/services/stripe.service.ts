import { Injectable } from '@angular/core';
import { CartItem } from '../models/product.model';
import { NotificationService } from './notification.service';

/**
 * Service de gestion des paiements Stripe SANS backend
 * Utilise les Payment Links Stripe (liens de paiement directs)
 */
@Injectable({
  providedIn: 'root'
})
export class StripeService {

  /**
   * CONFIGURATION : Associer chaque produit à son Payment Link Stripe
   *
   * Comment créer vos Payment Links :
   * 1. Aller sur https://dashboard.stripe.com/test/payment-links
   * 2. Cliquer sur "Nouveau lien de paiement"
   * 3. Remplir les infos du produit (nom, prix, description)
   * 4. Copier le lien généré (commence par https://buy.stripe.com/...)
   * 5. L'ajouter ici avec l'ID du produit correspondant
   */
  private paymentLinks: { [productId: number]: string } = {
    // Exemple :
    // 1: 'https://buy.stripe.com/test_XXXXXXX', // Oud Royal
    // 2: 'https://buy.stripe.com/test_YYYYYYY', // Rose de Damas
    // 3: 'https://buy.stripe.com/test_ZZZZZZZ', // Ambre Noir
    // etc...
  };

  constructor(private notificationService: NotificationService) {}

  /**
   * Redirige vers le Payment Link Stripe pour un seul produit
   */
  checkoutSingleProduct(productId: number, quantity: number = 1): void {
    const paymentLink = this.paymentLinks[productId];

    if (!paymentLink) {
      this.notificationService.error(`Payment Link non configuré pour le produit ID ${productId}.\n\nVeuillez créer un Payment Link sur Stripe Dashboard et l'ajouter dans stripe.service.ts`);
      console.error(`Payment Link manquant pour le produit ${productId}`);
      return;
    }

    // Ajouter la quantité à l'URL si > 1
    const url = quantity > 1
      ? `${paymentLink}?quantity=${quantity}`
      : paymentLink;

    // Redirection vers Stripe
    window.location.href = url;
  }

  /**
   * Ouvre le formulaire de contact WhatsApp avec le récapitulatif du panier
   * Alternative au paiement en ligne : paiement sur place ou à la livraison
   */
  checkoutViaWhatsApp(items: CartItem[], contactWhatsApp: string): void {
    const total = this.calculateTotal(items);

    // Créer le message WhatsApp
    let message = "🛍️ *Nouvelle commande*\n\n";

    items.forEach(item => {
      message += `• ${item.product.nom}\n`;
      message += `  Quantité: ${item.quantity}\n`;
      message += `  Prix: ${item.product.prix}€ x ${item.quantity} = ${(item.product.prix * item.quantity).toFixed(2)}€\n\n`;
    });

    message += `💰 *Total: ${total.toFixed(2)}€*\n\n`;
    message += `Je souhaite commander ces produits.`;

    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = contactWhatsApp.replace(/\s/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Génère un email de commande
   */
  checkoutViaEmail(items: CartItem[], contactEmail: string): void {
    const total = this.calculateTotal(items);

    const subject = 'Nouvelle commande - Parfums & Incenses d\'Orient';

    let body = 'Bonjour,\n\nJe souhaite commander les produits suivants :\n\n';

    items.forEach(item => {
      body += `- ${item.product.nom}\n`;
      body += `  Quantité: ${item.quantity}\n`;
      body += `  Prix unitaire: ${item.product.prix}€\n`;
      body += `  Sous-total: ${(item.product.prix * item.quantity).toFixed(2)}€\n\n`;
    });

    body += `Total: ${total.toFixed(2)}€\n\n`;
    body += 'Merci de me confirmer la disponibilité et les modalités de livraison.\n\n';
    body += 'Cordialement';

    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  /**
   * Calcule le montant total
   */
  calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      return sum + (item.product.prix * item.quantity);
    }, 0);
  }

  /**
   * Vérifie si un produit a un Payment Link configuré
   */
  hasPaymentLink(productId: number): boolean {
    return !!this.paymentLinks[productId];
  }

  /**
   * Vérifie si tous les produits du panier ont des Payment Links
   */
  allProductsHavePaymentLinks(items: CartItem[]): boolean {
    return items.every(item => this.hasPaymentLink(item.product.id));
  }
}
