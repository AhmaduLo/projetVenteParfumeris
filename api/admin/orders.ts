/**
 * API Admin - Récupération des commandes Stripe
 *
 * Route : GET /api/admin/orders
 * Header : Authorization: Bearer <JWT>
 *
 * Query params optionnels :
 * - limit: nombre de commandes à récupérer (défaut: 50, max: 100)
 * - starting_after: ID de session pour la pagination
 * - period: 'today' | 'month' | 'year' | 'all' (défaut: 'all')
 *
 * Retourne :
 * - Liste des sessions de paiement complètes
 * - Détails de chaque commande (client, montant, produits, date)
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireAuth } from '../../lib/utils/verifyJWT';

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
    console.log('📦 Récupération des commandes Stripe...');

    // ===== RÉCUPÉRER LES PARAMÈTRES DE REQUÊTE =====
    const limit = Math.min(Number.parseInt(req.query.limit as string) || 50, 100);
    const startingAfter = req.query.starting_after as string | undefined;
    const period = (req.query.period as string) || 'all';
    const shippingStatusFilter = (req.query.shipping_status as string) || 'all';

    // ===== CALCULER LA DATE DE DÉBUT SELON LA PÉRIODE =====
    const now = Math.floor(Date.now() / 1000);
    let createdAfter: number | undefined;

    switch (period) {
      case 'today':
        // Début de la journée (00:00:00)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        createdAfter = Math.floor(startOfDay.getTime() / 1000);
        break;

      case 'month':
        // Début du mois en cours
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        createdAfter = Math.floor(startOfMonth.getTime() / 1000);
        break;

      case 'year':
        // Début de l'année en cours
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        createdAfter = Math.floor(startOfYear.getTime() / 1000);
        break;

      case 'all':
      default:
        // Pas de filtre de date
        createdAfter = undefined;
        break;
    }

    // ===== RÉCUPÉRER LES SESSIONS DE PAIEMENT RÉUSSIES =====
    const sessionsParams: Stripe.Checkout.SessionListParams = {
      limit,
      status: 'complete',
      expand: ['data.payment_intent'], // Récupérer les Payment Intents directement
    };

    if (startingAfter) {
      sessionsParams.starting_after = startingAfter;
    }

    if (createdAfter) {
      sessionsParams.created = { gte: createdAfter };
    }

    console.log('📅 Filtre période:', period, createdAfter ? `(depuis ${new Date(createdAfter * 1000).toISOString()})` : '(toutes)');

    const sessions = await stripe.checkout.sessions.list(sessionsParams);

    // ===== ENRICHIR LES DONNÉES DES COMMANDES =====
    const orders = await Promise.all(
      sessions.data.map(async (session) => {
        try {
          // Récupérer les line items (produits achetés) avec expand pour avoir les images
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            limit: 100,
            expand: ['data.price.product'], // Récupérer les détails du produit
          });

          // Récupérer le Payment Intent pour obtenir le statut d'expédition
          let shippingStatus = 'pending';
          let trackingNumber = '';

          // Le Payment Intent est déjà chargé grâce à expand
          if (session.payment_intent && typeof session.payment_intent !== 'string') {
            shippingStatus = session.payment_intent.metadata?.shipping_status || 'pending';
            trackingNumber = session.payment_intent.metadata?.tracking_number || '';
          }

          // Enrichir les items avec les images des produits
          const enrichedItems = await Promise.all(
            lineItems.data.map(async (item) => {
              let imageUrl: string | null = null;

              // Récupérer l'image du produit si disponible
              if (item.price?.product) {
                const product = item.price.product as Stripe.Product;
                imageUrl = product.images?.[0] || null;
              }

              return {
                name: item.description,
                quantity: item.quantity,
                price: item.amount_total ? item.amount_total / 100 : 0,
                image: imageUrl,
              };
            })
          );

          return {
            id: session.id,
            status: session.payment_status,
            shippingStatus,
            trackingNumber,
            amount: session.amount_total ? session.amount_total / 100 : 0, // Centimes → Euros
            currency: session.currency || 'eur',
            customer: {
              email: session.customer_details?.email || 'N/A',
              name: session.customer_details?.name || 'N/A',
            },
            items: enrichedItems,
            created: session.created,
            createdDate: new Date(session.created * 1000).toISOString(),
            metadata: session.metadata || {},
          };
        } catch (error) {
          console.error(`❌ Erreur récupération détails session ${session.id}:`, error);
          // Retourner quand même les infos de base
          return {
            id: session.id,
            status: session.payment_status,
            shippingStatus: 'pending',
            trackingNumber: '',
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'eur',
            customer: {
              email: session.customer_details?.email || 'N/A',
              name: session.customer_details?.name || 'N/A',
            },
            items: [],
            created: session.created,
            createdDate: new Date(session.created * 1000).toISOString(),
            metadata: session.metadata || {},
          };
        }
      })
    );

    // ===== FILTRER PAR STATUT D'EXPÉDITION =====
    let filteredOrders = orders;
    if (shippingStatusFilter !== 'all') {
      filteredOrders = orders.filter(order => order.shippingStatus === shippingStatusFilter);
    }

    console.log(`📦 ${filteredOrders.length} commandes après filtrage (statut: ${shippingStatusFilter})`);

    // ===== RETOURNER LES COMMANDES =====
    return res.status(200).json({
      success: true,
      orders: filteredOrders,
      hasMore: sessions.has_more,
      count: filteredOrders.length,
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération commandes Stripe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des commandes',
      message: error.message
    });
  }
}
