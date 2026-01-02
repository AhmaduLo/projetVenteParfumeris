import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, CategoryFormData } from '../models/category.model';

/**
 * Service de gestion des catégories de produits
 * Stockage local avec localStorage pour persister les données
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'product_categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadCategories();
  }

  /**
   * Charge les catégories depuis le localStorage
   */
  private loadCategories(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const categories = JSON.parse(stored);
        this.categoriesSubject.next(categories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        this.initializeDefaultCategories();
      }
    } else {
      this.initializeDefaultCategories();
    }
  }

  /**
   * Initialise les catégories par défaut
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: Category[] = [
      {
        id: '1',
        name: 'Parfum',
        slug: 'parfum',
        description: 'Parfums d\'Orient',
        active: true,
        createdAt: Date.now()
      },
      {
        id: '2',
        name: 'Encens',
        slug: 'encens',
        description: 'Encens traditionnels',
        active: true,
        createdAt: Date.now()
      }
    ];
    this.saveCategories(defaultCategories);
  }

  /**
   * Sauvegarde les catégories dans le localStorage
   */
  private saveCategories(categories: Category[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
    this.categoriesSubject.next(categories);
  }

  /**
   * Récupère toutes les catégories
   */
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  /**
   * Récupère les catégories actives uniquement
   */
  getActiveCategories(): Category[] {
    return this.categoriesSubject.value.filter(cat => cat.active);
  }

  /**
   * Récupère une catégorie par son ID
   */
  getCategoryById(id: string): Category | undefined {
    return this.categoriesSubject.value.find(cat => cat.id === id);
  }

  /**
   * Récupère une catégorie par son slug
   */
  getCategoryBySlug(slug: string): Category | undefined {
    return this.categoriesSubject.value.find(cat => cat.slug === slug);
  }

  /**
   * Crée une nouvelle catégorie
   */
  createCategory(formData: CategoryFormData): Observable<{ success: boolean; category?: Category; error?: string }> {
    return new Observable(observer => {
      try {
        const categories = this.categoriesSubject.value;

        // Vérifier si le slug existe déjà
        if (categories.some(cat => cat.slug === formData.slug)) {
          observer.next({ success: false, error: 'Une catégorie avec ce slug existe déjà' });
          observer.complete();
          return;
        }

        const newCategory: Category = {
          id: Date.now().toString(),
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          active: formData.active,
          createdAt: Date.now()
        };

        const updatedCategories = [...categories, newCategory];
        this.saveCategories(updatedCategories);

        observer.next({ success: true, category: newCategory });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, error: 'Erreur lors de la création de la catégorie' });
        observer.complete();
      }
    });
  }

  /**
   * Met à jour une catégorie existante
   */
  updateCategory(id: string, formData: CategoryFormData): Observable<{ success: boolean; category?: Category; error?: string }> {
    return new Observable(observer => {
      try {
        const categories = this.categoriesSubject.value;
        const index = categories.findIndex(cat => cat.id === id);

        if (index === -1) {
          observer.next({ success: false, error: 'Catégorie non trouvée' });
          observer.complete();
          return;
        }

        // Vérifier si le slug existe déjà (sauf pour la catégorie courante)
        if (categories.some(cat => cat.slug === formData.slug && cat.id !== id)) {
          observer.next({ success: false, error: 'Une catégorie avec ce slug existe déjà' });
          observer.complete();
          return;
        }

        const updatedCategory: Category = {
          ...categories[index],
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          active: formData.active
        };

        const updatedCategories = [...categories];
        updatedCategories[index] = updatedCategory;
        this.saveCategories(updatedCategories);

        observer.next({ success: true, category: updatedCategory });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, error: 'Erreur lors de la mise à jour de la catégorie' });
        observer.complete();
      }
    });
  }

  /**
   * Supprime une catégorie
   */
  deleteCategory(id: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      try {
        const categories = this.categoriesSubject.value;
        const updatedCategories = categories.filter(cat => cat.id !== id);

        if (updatedCategories.length === categories.length) {
          observer.next({ success: false, error: 'Catégorie non trouvée' });
          observer.complete();
          return;
        }

        this.saveCategories(updatedCategories);
        observer.next({ success: true });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, error: 'Erreur lors de la suppression de la catégorie' });
        observer.complete();
      }
    });
  }

  /**
   * Génère un slug à partir d'un nom
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, ''); // Enlever les tirets au début et à la fin
  }
}
