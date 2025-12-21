/**
 * Vercel Serverless Function
 * Crée une session Stripe Checkout
 *
 * Route : POST /api/checkout
 * Body : { priceId: string, quantity: number }
 *
 * Pourquoi serverless ?
 * - La création de session Checkout nécessite la clé secrète
 * - On peut ajouter des métadonnées côté serveur
 * - Sécurité : évite que le client manipule les prix
 *
 * Documentation Stripe Checkout :
 * https://stripe.com/docs/api/checkout/sessions/create
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ===== CONFIGURATION CORS SÉCURISÉE =====
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://boutique-parfums.vercel.app',
    'http://localhost:4200',
    'http://localhost:3000'
  ];

  // Vérifier si l'origine est autorisée (domaine exact ou preview Vercel)
  const isAllowed = allowedOrigins.includes(origin) ||
                    (origin.endsWith('.vercel.app') && origin.includes('boutique-parfums'));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else {
    // Bloquer les origines non autorisées
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed'
    });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // ===== VALIDATION DES DONNÉES =====
    const { priceId, quantity = 1 } = req.body;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'priceId est requis'
      });
    }

    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        error: 'La quantité doit être entre 1 et 99'
      });
    }

    console.log(`🛒 Création session checkout pour priceId: ${priceId}, qty: ${quantity}`);

    // ===== CRÉATION DE LA SESSION STRIPE CHECKOUT =====
    const session = await stripe.checkout.sessions.create({
      // Mode de paiement (payment = paiement unique, subscription = abonnement)
      mode: 'payment',

      // Produits à acheter
      line_items: [
        {
          price: priceId,      // ID du prix Stripe (ex: price_xxx)
          quantity: quantity,
        },
      ],

      // 🔥 COLLECTE AUTOMATIQUE DE L'ADRESSE DE LIVRAISON
      shipping_address_collection: {
        // Pays autorisés pour la livraison
        allowed_countries: [
          'FR', // France
          'BE', // Belgique
          'CH', // Suisse
          'LU', // Luxembourg
          'MC', // Monaco
          'DE', // Allemagne
          'IT', // Italie
          'ES', // Espagne
          'PT', // Portugal
          'NL', // Pays-Bas
        ],
      },

      // 🔥 COLLECTE DU NUMÉRO DE TÉLÉPHONE
      phone_number_collection: {
        enabled: true, // Obligatoire
      },

      // 🔥 ADRESSE DE FACTURATION OBLIGATOIRE
      billing_address_collection: 'required',

      // 🔥 DEMANDER L'EMAIL DU CLIENT (pour les notifications)
      customer_creation: 'always',
      customer_email: undefined, // Stripe demandera l'email dans le formulaire

      // ===== OPTIONS DE LIVRAISON (Optionnel) =====
      // Vous pouvez définir plusieurs options de livraison
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // Gratuit (en centimes)
              currency: 'eur',
            },
            display_name: 'Livraison standard',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 500, // 5€ (en centimes)
              currency: 'eur',
            },
            display_name: 'Livraison express',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 2,
              },
            },
          },
        },
      ],

      // ===== URLS DE REDIRECTION =====
      // URL après paiement réussi
      success_url: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/success?session_id={CHECKOUT_SESSION_ID}`,

      // URL si le client annule
      cancel_url: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/cancel`,

      // ===== MÉTADONNÉES PERSONNALISÉES (Optionnel) =====
      // Utile pour tracker la source de la commande
      metadata: {
        source: 'angular-app',
        timestamp: new Date().toISOString(),
      },

      // ===== OPTIONS SUPPLÉMENTAIRES =====
      // Langue de l'interface Stripe Checkout
      locale: 'fr',

      // Autoriser les codes promo (si configurés dans Stripe)
      allow_promotion_codes: true,

      // Collecter les informations fiscales (si nécessaire)
      // customer_creation: 'always',
    });

    console.log(`✅ Session créée: ${session.id}`);

    // ===== RETOURNER LA SESSION =====
    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url, // URL de redirection vers Stripe Checkout
    });

  } catch (error: any) {
    console.error('❌ Erreur création session:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la session',
      message: error.message,
      type: error.type,
      stripeKey: process.env['STRIPE_SECRET_KEY'] ? 'Present' : 'Missing',
      frontendUrl: process.env['FRONTEND_URL'] || 'Not set',
    });
  }
}
