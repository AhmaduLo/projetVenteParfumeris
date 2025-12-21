/**
 * Vercel Serverless Function
 * Crée une session Stripe Checkout pour plusieurs produits (panier complet)
 *
 * Route : POST /api/checkout-cart
 * Body : { items: Array<{ priceId: string, quantity: number }> }
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
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'items est requis et doit être un tableau non vide'
      });
    }

    // Valider chaque item
    for (const item of items) {
      if (!item.priceId || typeof item.priceId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Chaque item doit avoir un priceId valide'
        });
      }

      if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
        return res.status(400).json({
          success: false,
          error: 'La quantité de chaque item doit être entre 1 et 99'
        });
      }
    }

    console.log(`🛒 Création session checkout pour ${items.length} produit(s)`);

    // ===== CONSTRUCTION DES LINE_ITEMS =====
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    // ===== CRÉATION DE LA SESSION STRIPE CHECKOUT =====
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,

      // 🔥 COLLECTE AUTOMATIQUE DE L'ADRESSE DE LIVRAISON
      shipping_address_collection: {
        allowed_countries: [
          'FR', 'BE', 'CH', 'LU', 'MC',
          'DE', 'IT', 'ES', 'PT', 'NL'
        ],
      },

      // 🔥 COLLECTE DU NUMÉRO DE TÉLÉPHONE
      phone_number_collection: {
        enabled: true,
      },

      // 🔥 ADRESSE DE FACTURATION OBLIGATOIRE
      billing_address_collection: 'required',

      // 🔥 DEMANDER L'EMAIL DU CLIENT (pour les notifications)
      customer_creation: 'always',
      customer_email: undefined, // Stripe demandera l'email dans le formulaire

      // OPTIONS DE LIVRAISON
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
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
              amount: 500, // 5€
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

      // URLS DE REDIRECTION
      success_url: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/cancel`,

      // MÉTADONNÉES
      metadata: {
        source: 'angular-app-cart',
        itemCount: items.length.toString(),
        timestamp: new Date().toISOString(),
      },

      // OPTIONS SUPPLÉMENTAIRES
      locale: 'fr',
      allow_promotion_codes: true,
    });

    console.log(`✅ Session créée: ${session.id}`);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('❌ Erreur création session:', error);
    console.error('❌ Message:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la session',
      message: error.message,
      type: error.type,
    });
  }
}
