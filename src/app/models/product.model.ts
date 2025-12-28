/**
 * Interface représentant un produit (parfum ou incense)
 */
export interface Product {
  id: number;
  nom: string;
  categorie: 'parfum' | 'incense';
  prix: number; // en euros
  image: string;
  description: string;
  caracteristiques: {
    contenance?: string;
    origine: string;
    notes?: string;
    duree?: string;
  };
  nouveau: boolean;
}

/**
 * Interface pour les produits Stripe (administration)
 */
export interface StripeProduct {
  id: string; // ID Stripe du produit
  name: string;
  description: string;
  price: number; // Prix en euros
  priceId: string; // ID du prix Stripe
  images: string[]; // URLs des images
  stock: number;
  active: boolean; // Produit actif ou non

  // Métadonnées personnalisées
  metadata: {
    origin?: string; // Origine (france, maroc, etc.)
    duration?: string; // Durée (8h-10h, etc.)
    notes?: string; // Notes (tres recommande, etc.)
    flavor?: string; // Saveur (vanille, bois de santal, etc.)
    category?: string; // Catégorie (parfum, encens)
    [key: string]: string | undefined; // Autres métadonnées personnalisées
  };

  createdAt?: number;
  updatedAt?: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  active: boolean;
  metadata: {
    origin?: string;
    duration?: string;
    notes?: string;
    flavor?: string;
    category?: string;
    [key: string]: string | undefined;
  };
}

export interface ProductsResponse {
  success: boolean;
  products?: StripeProduct[];
  product?: StripeProduct;
  error?: string;
}

/**
 * Interface pour les informations de contact de la boutique
 */
export interface ContactInfo {
  nom: string;
  telephone: string;
  email: string;
  whatsapp: string;
  adresse: string;
}

/**
 * Interface représentant un article dans le panier
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Interface pour l'intention de paiement Stripe
 */
export interface StripePaymentIntent {
  clientSecret: string;
  amount: number;
}
