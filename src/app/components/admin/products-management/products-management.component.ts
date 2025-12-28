import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { StripeProduct, ProductFormData } from '../../../models/product.model';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-management.component.html',
  styleUrl: './products-management.component.scss'
})
export class ProductsManagementComponent implements OnInit {
  products: StripeProduct[] = [];
  loading = true;
  error: string | null = null;
  hasMore = false;

  // Modal d'édition/création
  showModal = false;
  isEditMode = false;
  selectedProduct: StripeProduct | null = null;

  // Formulaire
  formData: ProductFormData = {
    name: '',
    description: '',
    price: 0,
    images: [],
    stock: 0,
    active: true,
    metadata: {
      origin: '',
      duration: '',
      notes: '',
      flavor: '',
      category: 'parfum'
    }
  };

  // Image URL temporaire
  tempImageUrl = '';

  // Nouveaux champs de métadonnées personnalisées
  customMetadataKey = '';
  customMetadataValue = '';

  // Sauvegarde et messages
  saving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(startingAfter?: string): void {
    this.loading = true;
    this.error = null;

    this.adminService.getProducts(100, startingAfter).subscribe({
      next: (response) => {
        if (response.success && response.products) {
          if (startingAfter) {
            this.products = [...this.products, ...response.products];
          } else {
            this.products = response.products;
          }
        } else {
          this.error = response.error || 'Impossible de charger les produits';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
        this.error = error.message || 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedProduct = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(product: StripeProduct): void {
    this.isEditMode = true;
    this.selectedProduct = product;
    this.formData = {
      name: product.name,
      description: product.description,
      price: product.price,
      images: [...product.images],
      stock: product.stock,
      active: product.active,
      metadata: { ...product.metadata }
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedProduct = null;
    this.resetForm();
    this.successMessage = null;
    this.errorMessage = null;
  }

  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      price: 0,
      images: [],
      stock: 0,
      active: true,
      metadata: {
        origin: '',
        duration: '',
        notes: '',
        flavor: '',
        category: 'parfum'
      }
    };
    this.tempImageUrl = '';
    this.customMetadataKey = '';
    this.customMetadataValue = '';
  }

  addImage(): void {
    if (this.tempImageUrl.trim()) {
      this.formData.images.push(this.tempImageUrl.trim());
      this.tempImageUrl = '';
    }
  }

  removeImage(index: number): void {
    this.formData.images.splice(index, 1);
  }

  addCustomMetadata(): void {
    if (this.customMetadataKey.trim() && this.customMetadataValue.trim()) {
      this.formData.metadata[this.customMetadataKey.trim()] = this.customMetadataValue.trim();
      this.customMetadataKey = '';
      this.customMetadataValue = '';
    }
  }

  removeCustomMetadata(key: string): void {
    delete this.formData.metadata[key];
  }

  getCustomMetadataKeys(): string[] {
    const standardKeys = ['origin', 'duration', 'notes', 'flavor', 'category'];
    return Object.keys(this.formData.metadata).filter(key => !standardKeys.includes(key));
  }

  saveProduct(): void {
    this.saving = true;
    this.successMessage = null;
    this.errorMessage = null;

    if (this.isEditMode && this.selectedProduct) {
      // Mise à jour
      this.adminService.updateProduct(this.selectedProduct.id, this.formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Produit mis à jour avec succès !';
            setTimeout(() => {
              this.closeModal();
              this.loadProducts();
            }, 1500);
          } else {
            this.errorMessage = response.error || 'Erreur lors de la mise à jour';
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Erreur mise à jour produit:', error);
          this.errorMessage = error.message || 'Erreur lors de la mise à jour';
          this.saving = false;
        }
      });
    } else {
      // Création
      this.adminService.createProduct(this.formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Produit créé avec succès !';
            setTimeout(() => {
              this.closeModal();
              this.loadProducts();
            }, 1500);
          } else {
            this.errorMessage = response.error || 'Erreur lors de la création';
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Erreur création produit:', error);
          this.errorMessage = error.message || 'Erreur lors de la création';
          this.saving = false;
        }
      });
    }
  }

  deleteProduct(product: StripeProduct): void {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver le produit "${product.name}" ?`)) {
      return;
    }

    this.adminService.deleteProduct(product.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Produit désactivé avec succès !');
          this.loadProducts();
        } else {
          alert('Erreur : ' + (response.error || 'Erreur inconnue'));
        }
      },
      error: (error) => {
        console.error('Erreur suppression produit:', error);
        alert('Erreur lors de la suppression');
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
