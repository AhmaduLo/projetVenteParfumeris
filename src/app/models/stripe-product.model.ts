/**
 * Modèles TypeScript pour l'intégration Stripe
 *
 * Ces interfaces correspondent aux données retournées par :
 * - GET /api/products
 * - POST /api/checkout
 */

/**
 * Interface représentant un produit Stripe
 * Récupéré depuis /api/products
 */
export interface StripeProduct {
  /** ID unique du produit Stripe (commence par prod_) */
  id: string;

  /** Nom du produit (défini dans Stripe Dashboard) */
  name: string;

  /** Description du produit (optionnelle) */
  description: string;

  /** Tableau d'URLs d'images (ajoutées dans Stripe Dashboard) */
  images: string[];

  /** Prix du produit (peut être null si pas de prix par défaut) */
  price: {
    /** ID du prix Stripe (commence par price_) */
    id: string;

    /** Montant en euros (déjà converti depuis les centimes) */
    amount: number;

    /** Code de la devise (ex: 'eur', 'usd') */
    currency: string;

    /** Prix formaté pour l'affichage (ex: '45,00 €') */
    formatted: string;
  } | null;

  /** Métadonnées personnalisées (définies dans Stripe Dashboard) */
  metadata: {
    /** Exemples de métadonnées utiles : */
    category?: string;    // Catégorie du produit
    stock?: string;       // Stock disponible
    tags?: string;        // Tags séparés par des virgules
    featured?: string;    // Produit mis en avant (true/false)
    [key: string]: string | undefined; // Autres métadonnées
  };

  /** Timestamp de création (en secondes depuis epoch) */
  created: number;

  /** Produit actif ou non */
  active: boolean;
}

/**
 * Interface pour la requête de création de session checkout
 * Envoyée à POST /api/checkout
 */
export interface CheckoutRequest {
  /** ID du prix Stripe à acheter */
  priceId: string;

  /** Quantité à acheter (défaut: 1) */
  quantity: number;
}

/**
 * Interface pour la réponse de création de session checkout
 * Retournée par POST /api/checkout
 */
export interface CheckoutResponse {
  /** Indique si la session a été créée avec succès */
  success: boolean;

  /** ID de la session Stripe (commence par cs_) */
  sessionId: string;

  /** URL de redirection vers Stripe Checkout */
  url: string;
}

/**
 * Interface pour la réponse de /api/products
 */
export interface ProductsResponse {
  /** Indique si la requête a réussi */
  success: boolean;

  /** Nombre de produits retournés */
  count: number;

  /** Liste des produits */
  products: StripeProduct[];
}

/**
 * Interface pour les erreurs API
 */
export interface ApiError {
  /** Indique que la requête a échoué */
  success: false;

  /** Message d'erreur */
  error: string;

  /** Message détaillé (uniquement en développement) */
  message?: string;
}
