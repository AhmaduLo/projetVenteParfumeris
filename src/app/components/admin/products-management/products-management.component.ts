import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
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
  allProducts: StripeProduct[] = []; // Tous les produits
  loading = true;
  error: string | null = null;
  hasMore = false;

  // Filtre actif/inactif
  showOnlyInactive = false;

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

  // Upload d'images
  uploading = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
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
            this.allProducts = [...this.allProducts, ...response.products];
          } else {
            this.allProducts = response.products;
          }
          this.applyFilter();
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

  applyFilter(): void {
    if (this.showOnlyInactive) {
      // Afficher uniquement les produits désactivés
      this.products = this.allProducts.filter(p => !p.active);
    } else {
      // Afficher uniquement les produits actifs
      this.products = this.allProducts.filter(p => p.active);
    }
  }

  toggleFilter(): void {
    this.showOnlyInactive = !this.showOnlyInactive;
    this.applyFilter();
  }

  get activeProductsCount(): number {
    return this.allProducts.filter(p => p.active).length;
  }

  get inactiveProductsCount(): number {
    return this.allProducts.filter(p => !p.active).length;
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

  /**
   * Gère la sélection d'un fichier image
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.notificationService.warning('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.warning('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    this.uploading = true;
    this.errorMessage = null;

    try {
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload vers l'API
      const response = await fetch(`${this.adminService['apiUrl']}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success && result.url) {
        // Ajouter l'URL de l'image uploadée à la liste
        this.formData.images.push(result.url);
        this.notificationService.success('Image uploadée avec succès !');
      } else {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error: any) {
      console.error('Erreur upload image:', error);
      this.errorMessage = error.message || 'Erreur lors de l\'upload de l\'image';
    } finally {
      this.uploading = false;
      // Réinitialiser l'input file
      input.value = '';
    }
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

    // Désactiver automatiquement le produit si stock = 0
    if (this.formData.stock === 0) {
      this.formData.active = false;
    }

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
          this.notificationService.success('Produit désactivé avec succès !');
          this.loadProducts();
        } else {
          this.notificationService.error('Erreur : ' + (response.error || 'Erreur inconnue'));
        }
      },
      error: (error) => {
        console.error('Erreur suppression produit:', error);
        this.notificationService.error('Erreur lors de la suppression');
      }
    });
  }

  activateProduct(product: StripeProduct): void {
    if (!confirm(`Êtes-vous sûr de vouloir réactiver le produit "${product.name}" ?`)) {
      return;
    }

    this.adminService.updateProduct(product.id, { active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Produit réactivé avec succès !');
          this.loadProducts();
        } else {
          this.notificationService.error('Erreur : ' + (response.error || 'Erreur inconnue'));
        }
      },
      error: (error) => {
        console.error('Erreur activation produit:', error);
        this.notificationService.error('Erreur lors de l\'activation');
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
