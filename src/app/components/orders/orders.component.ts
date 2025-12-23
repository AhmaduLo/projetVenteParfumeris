import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { Product } from '../../models/product.model';

/**
 * Composant pour afficher l'historique des commandes
 */
@Component({
    selector: 'app-orders',
    imports: [CommonModule, ProductModalComponent],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  /** Produit sélectionné pour le modal */
  selectedProduct: Product | null = null;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orders = this.orderService.getOrders();
    this.loading = false;
  }

  /**
   * Formater une date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Récupérer le libellé du statut de livraison
   */
  getDeliveryStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En préparation',
      'shipped': 'Expédiée',
      'delivered': 'Livrée'
    };
    return labels[status] || status;
  }

  /**
   * Récupérer la classe CSS du statut
   */
  getDeliveryStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * Marquer comme livré (pour test)
   */
  markAsDelivered(orderId: string): void {
    if (confirm('Marquer cette commande comme livrée ?')) {
      this.orderService.updateDeliveryStatus(orderId, 'delivered');
      this.loadOrders();
    }
  }

  /**
   * Retour à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Afficher le nombre total d'articles dans une commande
   */
  getTotalItems(order: Order): number {
    return order.products.reduce((sum, p) => sum + p.quantity, 0);
  }

  /**
   * Formater l'adresse
   */
  formatAddress(order: Order): string {
    if (!order.shippingAddress) return 'Aucune adresse fournie';

    const addr = order.shippingAddress;
    return `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.postalCode} ${addr.city}, ${addr.country}`;
  }

  /**
   * Ouvre le modal avec les détails du produit
   */
  openProductModal(product: any): void {
    this.selectedProduct = this.convertOrderProductToLocal(product);
  }

  /**
   * Ferme le modal
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Convertit un produit de commande en modèle Product local
   */
  private convertOrderProductToLocal(orderProduct: any): Product {
    return {
      id: parseInt(orderProduct.id) || 0,
      nom: orderProduct.name,
      categorie: 'parfum', // Par défaut, car l'info n'est pas stockée dans les commandes
      prix: orderProduct.unitPrice,
      image: orderProduct.image || 'assets/images/placeholder.jpg',
      description: orderProduct.description || '',
      caracteristiques: {
        origine: 'Non spécifié'
      },
      nouveau: false
    };
  }
}
