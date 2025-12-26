/**
 * API Admin - Envoi d'emails aux clients via Resend
 *
 * Route : POST /api/admin/send-email
 * Header : Authorization: Bearer <JWT>
 *
 * Body :
 * {
 *   orderId: string,
 *   trackingNumber?: string
 * }
 *
 * Envoie un email de confirmation d'expédition au client
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import Stripe from 'stripe';
import { requireAuth } from '../utils/verifyJWT';

const resend = new Resend(process.env['RESEND_API_KEY']!);
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
    const { orderId, trackingNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId est requis'
      });
    }

    console.log('📧 Envoi email pour commande:', orderId);

    // ===== RÉCUPÉRER LES DÉTAILS DE LA COMMANDE STRIPE =====
    const session = await stripe.checkout.sessions.retrieve(orderId);

    if (!session.customer_details?.email) {
      return res.status(400).json({
        success: false,
        error: 'Aucun email client trouvé pour cette commande'
      });
    }

    // Récupérer les produits de la commande
    const lineItems = await stripe.checkout.sessions.listLineItems(orderId, {
      limit: 100,
      expand: ['data.price.product'],
    });

    const customerEmail = session.customer_details.email;
    const customerName = session.customer_details.name || 'Client';
    const orderAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';

    // Construire la liste des produits
    const productsList = lineItems.data.map(item => {
      const product = item.price?.product as Stripe.Product;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            ${item.description}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            ${item.amount_total ? (item.amount_total / 100).toFixed(2) : '0.00'} €
          </td>
        </tr>
      `;
    }).join('');

    // ===== CRÉER LE CONTENU DE L'EMAIL =====
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre commande a été expédiée</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📦 Commande expédiée !</h1>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
                Bonjour <strong>${customerName}</strong>,
              </p>

              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
                Bonne nouvelle ! Votre commande <strong>#${orderId.substring(0, 12)}...</strong> a été expédiée et est en route vers vous.
              </p>

              ${trackingNumber ? `
              <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #4a5568; font-weight: 600;">Numéro de suivi :</p>
                <p style="margin: 0; color: #667eea; font-size: 18px; font-weight: 700;">${trackingNumber}</p>
              </div>
              ` : ''}

              <!-- Récapitulatif de la commande -->
              <div style="margin: 30px 0;">
                <h2 style="font-size: 20px; color: #2d3748; margin: 0 0 20px 0;">Récapitulatif de votre commande</h2>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f7fafc;">
                      <th style="padding: 10px; text-align: left; color: #4a5568; font-weight: 600;">Produit</th>
                      <th style="padding: 10px; text-align: center; color: #4a5568; font-weight: 600;">Quantité</th>
                      <th style="padding: 10px; text-align: right; color: #4a5568; font-weight: 600;">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsList}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: 600; color: #2d3748;">Total :</td>
                      <td style="padding: 15px 10px; text-align: right; font-weight: 700; color: #667eea; font-size: 18px;">${orderAmount} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p style="font-size: 16px; color: #2d3748; margin: 30px 0 20px 0;">
                Merci pour votre confiance. Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>

              <p style="font-size: 14px; color: #718096; margin: 0;">
                Cordialement,<br>
                <strong>L'équipe Les Senteurs d'Amira</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                © ${new Date().getFullYear()} Les Senteurs d'Amira. Tous droits réservés.
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

    // ===== ENVOYER L'EMAIL VIA RESEND =====
    const emailData = await resend.emails.send({
      from: 'Les Senteurs d\'Amira <onboarding@resend.dev>', // À remplacer par ton domaine vérifié
      to: [customerEmail],
      subject: '📦 Votre commande a été expédiée !',
      html: emailHtml,
    });

    console.log('✅ Email envoyé avec succès:', emailData.data?.id);

    // Note: Le statut sera mis à jour côté frontend via l'API update-order-status

    return res.status(200).json({
      success: true,
      message: `Email envoyé à ${customerEmail}`,
      emailId: emailData.data?.id
    });

  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
      message: error.message
    });
  }
}
