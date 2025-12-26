/**
 * API Admin - Mise à jour du statut d'expédition d'une commande
 *
 * Route : POST /api/admin/update-order-status
 * Header : Authorization: Bearer <JWT>
 *
 * Body :
 * {
 *   orderId: string,
 *   shippingStatus: 'pending' | 'shipped' | 'delivered'
 * }
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireAuth } from '../utils/verifyJWT';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ===== CONFIGURATION CORS =====
  const origin = req.headers.origin;

  if (origin) {
    const allowedOrigins = [
      'https://les-senteurs-d-amira.vercel.app',
      'https://projet-vente-parfumeris.vercel.app',
      'http://localhost:4200',
      'http://localhost:3000'
    ];

    const isAllowed = allowedOrigins.includes(origin) ||
                      (origin.endsWith('.vercel.app') && origin.includes('les-senteurs-d-amira'));

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else {
      return res.status(403).json({
        success: false,
        error: 'Origin not allowed'
      });
    }
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

  // ===== VÉRIFICATION AUTHENTIFICATION =====
  if (!requireAuth(req, res)) {
    return;
  }

  try {
    const { orderId, shippingStatus } = req.body;

    if (!orderId || !shippingStatus) {
      return res.status(400).json({
        success: false,
        error: 'orderId et shippingStatus sont requis'
      });
    }

    if (!['pending', 'shipped', 'delivered'].includes(shippingStatus)) {
      return res.status(400).json({
        success: false,
        error: 'shippingStatus doit être "pending", "shipped" ou "delivered"'
      });
    }

    console.log(`📦 Mise à jour statut commande ${orderId} → ${shippingStatus}`);

    // Récupérer la session pour obtenir le Payment Intent
    const session = await stripe.checkout.sessions.retrieve(orderId, {
      expand: ['payment_intent']
    });

    if (!session.payment_intent) {
      return res.status(400).json({
        success: false,
        error: 'Aucun Payment Intent trouvé pour cette session'
      });
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;

    // Mettre à jour les metadata du Payment Intent
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        shipping_status: shippingStatus,
        shipping_status_updated_at: new Date().toISOString()
      }
    });

    console.log('✅ Statut mis à jour avec succès sur Payment Intent:', paymentIntentId);

    return res.status(200).json({
      success: true,
      message: `Statut mis à jour : ${shippingStatus}`,
      shippingStatus
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour statut:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
      message: error.message
    });
  }
}
