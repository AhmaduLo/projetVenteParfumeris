/**
 * Vercel Serverless Function
 * Récupère les produits actifs depuis Stripe
 *
 * Route : GET /api/products
 *
 * Pourquoi serverless ?
 * - La clé secrète Stripe ne peut PAS être exposée au front-end
 * - Cette fonction agit comme un proxy sécurisé
 * - Pas besoin de serveur Express complet
 *
 * Documentation Stripe :
 * https://stripe.com/docs/api/products/list
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// ⚠️ IMPORTANT : La clé secrète est dans les variables d'environnement Vercel
// Ne JAMAIS la mettre dans le code !
// Configuration : Vercel Dashboard > Settings > Environment Variables
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ===== CONFIGURATION CORS SÉCURISÉE =====
  const origin = req.headers.origin;

  // Si une origine est présente, vérifier qu'elle est autorisée
  if (origin) {
    const allowedOrigins = [
      'https://les-senteurs-amira.vercel.app',
      'http://localhost:4200',
      'http://localhost:3000'
    ];

    // Vérifier si l'origine est autorisée (domaine exact ou preview Vercel)
    const isAllowed = allowedOrigins.includes(origin) ||
                      (origin.endsWith('.vercel.app') && (origin.includes('les-senteurs-d-amira') || origin.includes('les-senteurs-amira') || origin.includes('boutique-parfums') || origin.includes('projet-vente-parfumeris')));

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else {
      // Bloquer les origines non autorisées
      return res.status(403).json({
        success: false,
        error: 'Origin not allowed'
      });
    }
  }
  // Si pas d'origine (requête directe), continuer sans headers CORS

  // Gérer les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accepter uniquement GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    console.log('📦 Récupération des produits Stripe...');

    // ===== ÉTAPE 1 : Récupérer tous les produits ACTIFS depuis Stripe =====
    const products = await stripe.products.list({
      active: true,        // Uniquement les produits actifs
      limit: 100,          // Maximum 100 produits (augmentez si nécessaire)
      expand: ['data.default_price'], // ⚠️ CRUCIAL : Récupère le prix en même temps
    });

    console.log(`✅ ${products.data.length} produits récupérés`);

    // ===== ÉTAPE 2 : Formater les données pour Angular =====
    const formattedProducts = products.data.map((product) => {
      // Le prix par défaut (expanded grâce au paramètre ci-dessus)
      const price = product.default_price as Stripe.Price | null;

      // Construire l'objet formaté
      return {
        // Identifiant unique du produit
        id: product.id,

        // Nom du produit (défini dans Stripe Dashboard)
        name: product.name,

        // Description (optionnelle)
        description: product.description || '',

        // Tableau d'URLs d'images (ajoutées dans Stripe Dashboard)
        images: product.images || [],

        // Prix formaté
        price: price ? {
          id: price.id,
          amount: price.unit_amount! / 100, // Convertir centimes en euros
          currency: price.currency,
          formatted: new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: price.currency.toUpperCase(),
          }).format(price.unit_amount! / 100),
        } : null,

        // Métadonnées personnalisées (définies dans Stripe Dashboard)
        // Exemples : category, stock, tags, etc.
        metadata: product.metadata || {},

        // Date de création
        created: product.created,

        // Statut actif
        active: product.active,
      };
    });

    // ===== ÉTAPE 3 : Retourner les produits formatés =====
    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });

  } catch (error: any) {
    // Gestion des erreurs
    // Log pour monitoring (sans exposer au client)
    console.error('❌ Erreur Stripe API:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits'
    });
  }
}
