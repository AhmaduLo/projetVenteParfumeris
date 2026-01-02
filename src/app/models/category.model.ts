/**
 * Interface représentant une catégorie de produit
 */
export interface Category {
  id: string;
  name: string;
  slug: string; // Identifiant unique pour l'URL (ex: 'parfum', 'encens')
  description?: string;
  active: boolean;
  createdAt: number;
}

/**
 * Interface pour le formulaire de création/édition de catégorie
 */
export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

/**
 * Interface pour les réponses API des catégories
 */
export interface CategoriesResponse {
  success: boolean;
  categories?: Category[];
  category?: Category;
  error?: string;
}
