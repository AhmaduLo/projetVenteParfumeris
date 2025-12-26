import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { Order, OrderPeriod } from '../../../models/order.model';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss'
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  hasMore = false;
  selectedPeriod: OrderPeriod = 'all';
  selectedShippingStatus: string = 'all';

  // Modal d'envoi d'email
  showEmailModal = false;
  selectedOrder: Order | null = null;
  trackingNumber = '';
  emailSending = false;
  emailSuccess: string | null = null;
  emailError: string | null = null;

  // Options de filtrage par période
  periodOptions: Array<{value: OrderPeriod, label: string}> = [
    { value: 'all', label: 'Toutes' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
  ];

  // Options de filtrage par statut d'expédition
  shippingStatusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'shipped', label: 'Expédiées' },
    { value: 'delivered', label: 'Reçues' }
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(startingAfter?: string): void {
    this.loading = true;
    this.error = null;

    this.adminService.getOrders(50, startingAfter, this.selectedPeriod, this.selectedShippingStatus).subscribe({
      next: (response) => {
        if (response.success && response.orders) {
          if (startingAfter) {
            // Pagination : ajouter les nouvelles commandes
            this.orders = [...this.orders, ...response.orders];
          } else {
            // Chargement initial
            this.orders = response.orders;
          }
          this.hasMore = response.hasMore || false;
          console.log('✅ Commandes chargées:', response.count, 'Période:', this.selectedPeriod);
        } else {
          this.error = response.error || 'Impossible de charger les commandes';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement commandes:', error);
        this.error = error.message || 'Erreur lors du chargement des commandes';
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    if (this.orders.length > 0 && this.hasMore) {
      const lastOrder = this.orders[this.orders.length - 1];
      this.loadOrders(lastOrder.id);
    }
  }

  filterByPeriod(period: OrderPeriod): void {
    this.selectedPeriod = period;
    this.orders = []; // Réinitialiser la liste
    this.loadOrders(); // Recharger avec le nouveau filtre
  }

  filterByShippingStatus(status: string): void {
    this.selectedShippingStatus = status;
    this.orders = []; // Réinitialiser la liste
    this.loadOrders(); // Recharger avec le nouveau filtre
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'paid': 'Payée',
      'unpaid': 'Non payée',
      'no_payment_required': 'Gratuit'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'paid': 'status-paid',
      'unpaid': 'status-unpaid',
      'no_payment_required': 'status-free'
    };
    return classMap[status] || 'status-unknown';
  }

  getShippingStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'shipped': 'Expédiée',
      'delivered': 'Reçue'
    };
    return statusMap[status] || status;
  }

  getShippingStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'pending': 'shipping-pending',
      'shipped': 'shipping-shipped',
      'delivered': 'shipping-delivered'
    };
    return classMap[status] || 'shipping-unknown';
  }

  openEmailModal(order: Order): void {
    this.selectedOrder = order;
    this.showEmailModal = true;
    this.trackingNumber = '';
    this.emailSuccess = null;
    this.emailError = null;
    this.emailSending = false;
  }

  closeEmailModal(): void {
    this.showEmailModal = false;
    this.selectedOrder = null;
    this.trackingNumber = '';
    this.emailSuccess = null;
    this.emailError = null;
    this.emailSending = false;
  }

  sendEmail(): void {
    if (!this.selectedOrder) return;

    this.emailSending = true;
    this.emailSuccess = null;
    this.emailError = null;

    // Envoyer l'email d'expédition
    this.adminService.sendShippingEmail(
      this.selectedOrder.id,
      this.trackingNumber || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Mettre à jour le statut de la commande
          this.adminService.updateShippingStatus(this.selectedOrder!.id, 'shipped').subscribe({
            next: () => {
              this.emailSuccess = 'Email envoyé et commande marquée comme expédiée !';

              // Mettre à jour localement
              if (this.selectedOrder) {
                this.selectedOrder.shippingStatus = 'shipped';
                if (this.trackingNumber) {
                  this.selectedOrder.trackingNumber = this.trackingNumber;
                }
              }

              // Recharger la liste pour mettre à jour l'affichage
              setTimeout(() => {
                this.closeEmailModal();
                this.orders = [];
                this.loadOrders();
              }, 2000);
            },
            error: (error) => {
              console.warn('⚠️ Email envoyé mais erreur mise à jour statut:', error);
              this.emailSuccess = 'Email envoyé (erreur mise à jour statut)';
              setTimeout(() => this.closeEmailModal(), 2000);
            }
          });
        } else {
          this.emailError = response.error || 'Erreur lors de l\'envoi de l\'email';
        }
        this.emailSending = false;
      },
      error: (error) => {
        console.error('❌ Erreur envoi email:', error);
        this.emailError = error.message || 'Erreur lors de l\'envoi de l\'email';
        this.emailSending = false;
      }
    });
  }

  markAsDelivered(order: Order): void {
    if (!confirm(`Marquer la commande #${order.id.substring(0, 12)}... comme reçue et envoyer un email de confirmation au client ?`)) {
      return;
    }

    // Envoyer l'email de livraison
    this.adminService.sendDeliveryEmail(order.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Mettre à jour le statut
          this.adminService.updateShippingStatus(order.id, 'delivered').subscribe({
            next: () => {
              console.log('✅ Email de réception envoyé et statut mis à jour');
              alert('Email envoyé et commande marquée comme reçue !');

              // Recharger la liste
              this.orders = [];
              this.loadOrders();
            },
            error: (error) => {
              console.error('❌ Erreur mise à jour statut:', error);
              alert('Email envoyé mais erreur lors de la mise à jour du statut');
            }
          });
        } else {
          alert('Erreur lors de l\'envoi de l\'email : ' + (response.error || 'Erreur inconnue'));
        }
      },
      error: (error) => {
        console.error('❌ Erreur envoi email livraison:', error);
        alert('Erreur lors de l\'envoi de l\'email');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
