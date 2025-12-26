/**
 * API Admin - Envoi d'email de confirmation de réception
 *
 * Route : POST /api/admin/send-delivery-email
 * Header : Authorization: Bearer <JWT>
 *
 * Body :
 * {
 *   orderId: string
 * }
 *
 * Envoie un email pour confirmer que le client a bien reçu sa commande
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
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId est requis'
      });
    }

    console.log('📧 Envoi email de réception pour commande:', orderId);

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
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            ${item.description}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            ${item.quantity}
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
  <title>Merci pour votre confiance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Commande bien reçue !</h1>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
                Bonjour <strong>${customerName}</strong>,
              </p>

              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
                Nous espérons que vous avez bien reçu votre commande <strong>#${orderId.substring(0, 12)}...</strong> et qu'elle vous donne entière satisfaction !
              </p>

              <div style="background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #22543d; font-size: 16px;">
                  💚 <strong>Merci pour votre confiance !</strong><br>
                  Votre avis compte beaucoup pour nous.
                </p>
              </div>

              <!-- Récapitulatif des produits -->
              <div style="margin: 30px 0;">
                <h2 style="font-size: 20px; color: #2d3748; margin: 0 0 20px 0;">Produits reçus</h2>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f7fafc;">
                      <th style="padding: 10px; text-align: left; color: #4a5568; font-weight: 600;">Produit</th>
                      <th style="padding: 10px; text-align: center; color: #4a5568; font-weight: 600;">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsList}
                  </tbody>
                </table>
              </div>

              <p style="font-size: 16px; color: #2d3748; margin: 30px 0 20px 0;">
                Si vous avez la moindre question ou remarque, n'hésitez pas à nous contacter. Nous sommes là pour vous !
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
      from: 'Les Senteurs d\'Amira <onboarding@resend.dev>',
      to: [customerEmail],
      subject: '✅ Merci pour votre confiance !',
      html: emailHtml,
    });

    console.log('✅ Email de réception envoyé avec succès:', emailData.data?.id);

    return res.status(200).json({
      success: true,
      message: `Email de réception envoyé à ${customerEmail}`,
      emailId: emailData.data?.id
    });

  } catch (error: any) {
    console.error('❌ Erreur envoi email de réception:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
      message: error.message
    });
  }
}
