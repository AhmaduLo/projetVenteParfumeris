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
