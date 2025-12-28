import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Webhook Stripe pour gérer les événements de paiement
 * Décrémenter le stock automatiquement après un paiement réussi
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Seules les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Récupérer la signature Stripe
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Signature manquante' });
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.error('❌ Erreur de vérification webhook:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Gérer les différents événements
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('✅ Paiement réussi:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Paiement échoué:', event.data.object.id);
        break;

      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Erreur traitement webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Gérer la complétion d'une session de checkout
 * Décrémenter le stock des produits achetés
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 Checkout complété:', session.id);

  try {
    // Récupérer les line items de la session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });

    // Pour chaque produit acheté
    for (const item of lineItems.data) {
      const product = item.price?.product as Stripe.Product;
      const quantity = item.quantity || 0;

      if (!product || quantity === 0) continue;

      // Récupérer le stock actuel
      const currentStock = parseInt(product.metadata.stock || '0');
      const newStock = Math.max(0, currentStock - quantity);

      // Mettre à jour le stock
      await stripe.products.update(product.id, {
        metadata: {
          ...product.metadata,
          stock: String(newStock)
        },
        // Désactiver le produit si stock = 0
        active: newStock > 0
      });

      console.log(`📦 Stock mis à jour pour ${product.name}: ${currentStock} → ${newStock}`);

      // Si le stock atteint 0, désactiver le produit
      if (newStock === 0) {
        console.log(`⚠️ Rupture de stock pour: ${product.name}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Erreur mise à jour stock:', error);
    throw error;
  }
}
