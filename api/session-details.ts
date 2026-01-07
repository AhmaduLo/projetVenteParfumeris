/**
 * Vercel Serverless Function
 * Récupère les détails complets d'une session Stripe Checkout
 *
 * Route : GET /api/session-details?session_id=xxx
 *
 * Retourne :
 * - Informations client (nom, email, téléphone, adresse)
 * - Liste des produits achetés avec quantités
 * - Montant total payé
 * - Statut de paiement
 * - Date d'achat
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
  const origin = req.headers.origin;

  // Si une origine est présente, vérifier qu'elle est autorisée
  if (origin) {
    const allowedOrigins = [
      'https://les-senteurs-d-amira-tan.vercel.app',
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'session_id est requis'
      });
    }

    console.log(`📦 Récupération des détails de la session: ${session_id}`);

    // ===== RÉCUPÉRER LA SESSION STRIPE =====
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        'line_items',
        'line_items.data.price.product',
        'customer',
        'payment_intent',
      ]
    });

    // Vérifier que le paiement a été effectué
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cette commande n\'a pas encore été payée'
      });
    }

    // ===== EXTRAIRE LES INFORMATIONS =====
    const lineItems = session.line_items?.data || [];

    // Formater les produits
    const products = lineItems.map(item => {
      const product = item.price?.product as Stripe.Product;
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        image: product.images?.[0] || null,
        quantity: item.quantity || 1,
        unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        totalPrice: item.amount_total / 100,
        currency: item.currency,
      };
    });

    // Informations client
    const customerDetails = {
      name: session.customer_details?.name || 'Non fourni',
      email: session.customer_details?.email || 'Non fourni',
      phone: session.customer_details?.phone || 'Non fourni',
    };

    // Adresse de livraison
    const shippingAddress = session.shipping_details?.address ? {
      line1: session.shipping_details.address.line1 || '',
      line2: session.shipping_details.address.line2 || '',
      city: session.shipping_details.address.city || '',
      postalCode: session.shipping_details.address.postal_code || '',
      state: session.shipping_details.address.state || '',
      country: session.shipping_details.address.country || '',
    } : null;

    // Informations de paiement
    const paymentDetails = {
      status: session.payment_status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      amountSubtotal: session.amount_subtotal ? session.amount_subtotal / 100 : 0,
      amountShipping: session.total_details?.amount_shipping ? session.total_details.amount_shipping / 100 : 0,
      currency: session.currency || 'eur',
    };

    // ===== RETOURNER LES DÉTAILS =====
    return res.status(200).json({
      success: true,
      order: {
        id: session.id,
        createdAt: new Date(session.created * 1000).toISOString(),
        customer: customerDetails,
        shippingAddress,
        products,
        payment: paymentDetails,
        status: 'paid', // Statut de paiement
        deliveryStatus: 'pending', // À mettre à jour manuellement
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération session:', error);

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails de la session',
      message: error.message,
    });
  }
}
