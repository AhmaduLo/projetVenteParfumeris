import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro';
import sgMail from '@sendgrid/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

// Configuration de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configuration pour désactiver le parsing automatique du body
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Récupérer le body brut (nécessaire pour la vérification de signature)
    const rawBody = await buffer(req);

    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(
      rawBody,
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
 * Décrémenter le stock des produits achetés et envoyer un email de confirmation
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 Checkout complété:', session.id);

  try {
    // Récupérer les line items de la session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });

    // Tableau pour stocker les détails des produits pour l'email
    const orderItems = [];
    let totalAmount = 0;

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

      // Ajouter les détails du produit pour l'email
      const price = (item.price?.unit_amount || 0) / 100;
      orderItems.push({
        name: product.name,
        quantity,
        price,
        image: product.images?.[0] || '',
        total: price * quantity
      });

      totalAmount += price * quantity;
    }

    // Envoyer l'email de confirmation
    if (session.customer_details?.email) {
      await sendConfirmationEmail(
        session.customer_details.email,
        session.customer_details.name || 'Client',
        orderItems,
        totalAmount,
        session.id
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur mise à jour stock:', error);
    throw error;
  }
}

/**
 * Envoyer un email de confirmation de commande
 */
async function sendConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderItems: Array<{ name: string; quantity: number; price: number; image: string; total: number }>,
  totalAmount: number,
  orderId: string
) {
  try {
    const emailHtml = generateEmailTemplate(customerName, orderItems, totalAmount, orderId);

    const msg = {
      to: customerEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@lessenteursdamira.com',
        name: 'Les Senteurs d\'Amira'
      },
      replyTo: process.env.SENDGRID_FROM_EMAIL || 'gbamba123@gmail.com',
      subject: 'Confirmation de votre commande - Les Senteurs d\'Amira',
      html: emailHtml
    };

    await sgMail.send(msg);

    console.log(`✅ Email envoyé à ${customerEmail}`);
  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    if (error.response) {
      console.error('Détails SendGrid:', error.response.body);
    }
  }
}

/**
 * Générer le template HTML de l'email
 */
function generateEmailTemplate(
  customerName: string,
  orderItems: Array<{ name: string; quantity: number; price: number; image: string; total: number }>,
  totalAmount: number,
  orderId: string
): string {
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" width="60" height="60" style="display: block; width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 10px; vertical-align: middle; border: 0;">` : ''}
        <strong style="display: inline-block; vertical-align: middle;">${item.name}</strong>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} €</td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;"><strong>${item.total.toFixed(2)} €</strong></td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <!-- En-tête -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">Les Senteurs d'Amira</h1>
              <p style="margin: 10px 0 0 0; color: #e2d4c0; font-size: 14px;">Confirmation de commande</p>
            </td>
          </tr>

          <!-- Message de remerciement -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 22px;">Merci pour votre commande !</h2>
              <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${customerName}</strong>,
              </p>
              <p style="margin: 15px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Nous avons bien reçu votre commande et nous vous en remercions. Votre paiement a été confirmé avec succès.
              </p>
            </td>
          </tr>

          <!-- Détails de la commande -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #2d3748; font-size: 14px;">
                  <strong>Numéro de commande :</strong> ${orderId}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 15px; text-align: left; color: #2d3748; font-size: 14px;">Produit</th>
                    <th style="padding: 15px; text-align: center; color: #2d3748; font-size: 14px;">Quantité</th>
                    <th style="padding: 15px; text-align: right; color: #2d3748; font-size: 14px;">Prix unitaire</th>
                    <th style="padding: 15px; text-align: right; color: #2d3748; font-size: 14px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="background-color: #f8f9fa;">
                    <td colspan="3" style="padding: 20px; text-align: right; color: #2d3748; font-size: 16px;"><strong>Total :</strong></td>
                    <td style="padding: 20px; text-align: right; color: #2d3748; font-size: 18px;"><strong>${totalAmount.toFixed(2)} €</strong></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Prochaines étapes -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #e2f0d9; border-left: 4px solid #48bb78; padding: 20px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Prochaines étapes</h3>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                  Votre commande est en cours de préparation. Vous recevrez un email de confirmation d'expédition dès que votre colis sera envoyé.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">
                Besoin d'aide ? Contactez-nous à <a href="mailto:contact@lessenteursdamira.com" style="color: #e2d4c0; text-decoration: none;">contact@lessenteursdamira.com</a>
              </p>
              <p style="margin: 0; color: #718096; font-size: 12px;">
                © 2025 Les Senteurs d'Amira. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
