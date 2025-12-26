/**
 * API Admin - Statistiques Stripe
 *
 * Route : GET /api/admin/stats
 * Header : Authorization: Bearer <JWT>
 *
 * Retourne :
 * - Nombre total de commandes
 * - Revenus totaux
 * - Nombre de produits actifs
 * - Nombre de clients uniques
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
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  // ===== VÉRIFICATION AUTHENTIFICATION =====
  if (!requireAuth(req, res)) {
    return; // requireAuth a déjà envoyé la réponse 401/403
  }

  try {
    console.log('📊 Récupération des statistiques Stripe...');

    // ===== RÉCUPÉRER LES SESSIONS DE PAIEMENT RÉUSSIES =====
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete', // Seulement les paiements réussis
    });

    // ===== CALCULER LES STATISTIQUES =====
    const totalOrders = sessions.data.length;

    // Revenus totaux (en centimes -> euros)
    const totalRevenue = sessions.data.reduce((sum, session) => {
      return sum + (session.amount_total || 0);
    }, 0) / 100; // Convertir centimes -> euros

    // Clients uniques (basé sur les emails)
    const uniqueCustomers = new Set(
      sessions.data
        .map(session => session.customer_details?.email)
        .filter(email => email !== null && email !== undefined)
    );
    const totalCustomers = uniqueCustomers.size;

    // ===== RÉCUPÉRER LES PRODUITS ACTIFS =====
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
    const totalProducts = products.data.length;

    // ===== STATISTIQUES PAR PÉRIODE (7 derniers jours) =====
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);

    const recentSessions = sessions.data.filter(session =>
      (session.created || 0) >= sevenDaysAgo
    );

    const recentRevenue = recentSessions.reduce((sum, session) => {
      return sum + (session.amount_total || 0);
    }, 0) / 100;

    // ===== RETOURNER LES STATS =====
    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2), // Format: "123.45"
        totalProducts,
        totalCustomers,
        // Stats supplémentaires
        recentOrders: recentSessions.length, // 7 derniers jours
        recentRevenue: recentRevenue.toFixed(2),
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00',
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération stats Stripe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
}
