/**
 * API Admin Unifiée
 *
 * Consolide tous les endpoints admin en un seul fichier pour réduire
 * le nombre de serverless functions sur Vercel
 *
 * Routes gérées via query parameter "action":
 * - POST /api/admin?action=login
 * - GET /api/admin?action=orders
 * - GET/POST/PUT/DELETE /api/admin?action=products
 * - GET /api/admin?action=stats
 * - POST /api/admin?action=send-email
 * - POST /api/admin?action=send-delivery-email
 * - POST /api/admin?action=update-order-status
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { requireAuth } from '../lib/utils/verifyJWT';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '../lib/utils/rateLimiter';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2024-11-20.acacia'
});

const resend = new Resend(process.env['RESEND_API_KEY']!);

// Configuration admin
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'admin@example.com';
const ADMIN_PASSWORD_HASH = process.env['ADMIN_PASSWORD_HASH'] || '$2a$10$YourHashedPasswordHere';
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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

  // Déterminer l'action à effectuer
  const action = req.query.action as string;

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action parameter required'
    });
  }

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'orders':
        return await handleOrders(req, res);
      case 'products':
        return await handleProducts(req, res);
      case 'stats':
        return await handleStats(req, res);
      case 'send-email':
        return await handleSendEmail(req, res);
      case 'send-delivery-email':
        return await handleSendDeliveryEmail(req, res);
      case 'update-order-status':
        return await handleUpdateOrderStatus(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }
  } catch (error: any) {
    console.error('❌ Erreur API Admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message
    });
  }
}

// ===== HANDLER: LOGIN =====
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const rateLimitCheck = checkRateLimit(req);

  if (!rateLimitCheck.allowed) {
    console.log('⚠️ Tentative de connexion bloquée (trop de tentatives)');
    return res.status(429).json({
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
      retryAfter: rateLimitCheck.retryAfter
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis'
    });
  }

  if (email !== ADMIN_EMAIL) {
    await new Promise(resolve => setTimeout(resolve, 500));
    recordFailedAttempt(req);
    console.log('❌ Tentative de connexion échouée');
    return res.status(401).json({
      success: false,
      error: 'Email ou mot de passe incorrect'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!isPasswordValid) {
    recordFailedAttempt(req);
    console.log('❌ Tentative de connexion échouée');
    return res.status(401).json({
      success: false,
      error: 'Email ou mot de passe incorrect'
    });
  }

  const payload = {
    email: email,
    role: 'admin',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION
  });

  resetAttempts(req);
  console.log('✅ Connexion admin réussie');

  return res.status(200).json({
    success: true,
    token: token,
    message: 'Connexion réussie'
  });
}

// ===== HANDLER: ORDERS =====
async function handleOrders(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
  }

  if (!requireAuth(req, res)) {
    return;
  }

  console.log('📦 Récupération des commandes Stripe...');

  const limit = Math.min(Number.parseInt(req.query.limit as string) || 50, 100);
  const startingAfter = req.query.starting_after as string | undefined;
  const period = (req.query.period as string) || 'all';
  const shippingStatusFilter = (req.query.shipping_status as string) || 'all';

  const now = Math.floor(Date.now() / 1000);
  let createdAfter: number | undefined;

  switch (period) {
    case 'today':
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      createdAfter = Math.floor(startOfDay.getTime() / 1000);
      break;
    case 'month':
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      createdAfter = Math.floor(startOfMonth.getTime() / 1000);
      break;
    case 'year':
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      createdAfter = Math.floor(startOfYear.getTime() / 1000);
      break;
    case 'all':
    default:
      createdAfter = undefined;
      break;
  }

  const sessionsParams: Stripe.Checkout.SessionListParams = {
    limit,
    status: 'complete',
    expand: ['data.payment_intent'],
  };

  if (startingAfter) {
    sessionsParams.starting_after = startingAfter;
  }

  if (createdAfter) {
    sessionsParams.created = { gte: createdAfter };
  }

  console.log('📅 Filtre période:', period, createdAfter ? `(depuis ${new Date(createdAfter * 1000).toISOString()})` : '(toutes)');

  const sessions = await stripe.checkout.sessions.list(sessionsParams);

  const orders = await Promise.all(
    sessions.data.map(async (session) => {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
          expand: ['data.price.product'],
        });

        let shippingStatus = 'pending';
        let trackingNumber = '';

        if (session.payment_intent && typeof session.payment_intent !== 'string') {
          shippingStatus = session.payment_intent.metadata?.shipping_status || 'pending';
          trackingNumber = session.payment_intent.metadata?.tracking_number || '';
        }

        const enrichedItems = await Promise.all(
          lineItems.data.map(async (item) => {
            let imageUrl: string | null = null;

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
          amount: session.amount_total ? session.amount_total / 100 : 0,
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

  let filteredOrders = orders;
  if (shippingStatusFilter !== 'all') {
    filteredOrders = orders.filter(order => order.shippingStatus === shippingStatusFilter);
  }

  console.log(`📦 ${filteredOrders.length} commandes après filtrage (statut: ${shippingStatusFilter})`);

  return res.status(200).json({
    success: true,
    orders: filteredOrders,
    hasMore: sessions.has_more,
    count: filteredOrders.length,
  });
}

// ===== HANDLER: PRODUCTS =====
async function handleProducts(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) {
    return;
  }

  // GET - Lister tous les produits
  if (req.method === 'GET') {
    const { limit = 100, starting_after } = req.query;

    const productsParams: Stripe.ProductListParams = {
      limit: Number(limit),
      expand: ['data.default_price']
    };

    if (starting_after) {
      productsParams.starting_after = String(starting_after);
    }

    const products = await stripe.products.list(productsParams);

    const formattedProducts = products.data.map(product => {
      const price = product.default_price;
      let priceAmount = 0;
      let priceId = '';

      if (price && typeof price !== 'string') {
        priceAmount = price.unit_amount ? price.unit_amount / 100 : 0;
        priceId = price.id;
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: priceAmount,
        priceId: priceId,
        images: product.images || [],
        stock: parseInt(product.metadata.stock || '0'),
        active: product.active,
        metadata: {
          origin: product.metadata.origin,
          duration: product.metadata.duration,
          notes: product.metadata.notes,
          flavor: product.metadata.flavor,
          category: product.metadata.category,
          ...product.metadata
        },
        createdAt: product.created,
        updatedAt: product.updated || product.created
      };
    });

    return res.status(200).json({
      success: true,
      products: formattedProducts,
      hasMore: products.has_more
    });
  }

  // POST - Créer un nouveau produit
  if (req.method === 'POST') {
    const { name, description, price, images, stock, active, metadata } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et le prix sont obligatoires'
      });
    }

    const product = await stripe.products.create({
      name,
      description: description || '',
      images: images || [],
      active: active !== undefined ? active : true,
      metadata: {
        stock: String(stock || 0),
        ...metadata
      }
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'eur'
    });

    const updatedProduct = await stripe.products.update(product.id, {
      default_price: stripePrice.id
    });

    return res.status(201).json({
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description || '',
        price: price,
        priceId: stripePrice.id,
        images: updatedProduct.images || [],
        stock: stock || 0,
        active: updatedProduct.active,
        metadata: metadata || {},
        createdAt: updatedProduct.created
      }
    });
  }

  // PUT - Mettre à jour un produit existant
  if (req.method === 'PUT') {
    const { productId, name, description, price, images, stock, active, metadata } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'ID du produit requis'
      });
    }

    const updateData: Stripe.ProductUpdateParams = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;

    if (stock !== undefined || metadata !== undefined) {
      const finalStock = stock !== undefined ? stock : 0;
      updateData.metadata = {
        ...(metadata || {}),
        stock: String(finalStock)
      };

      if (finalStock === 0) {
        updateData.active = false;
      } else if (active !== undefined) {
        updateData.active = active;
      } else if (finalStock > 0) {
        updateData.active = true;
      }
    } else if (active !== undefined) {
      updateData.active = active;
    }

    const updatedProduct = await stripe.products.update(productId, updateData);

    let newPriceId = '';
    let newPrice = 0;

    if (price !== undefined) {
      const stripePrice = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(price * 100),
        currency: 'eur'
      });

      await stripe.products.update(productId, {
        default_price: stripePrice.id
      });

      newPriceId = stripePrice.id;
      newPrice = price;
    } else {
      const existingPrice = updatedProduct.default_price;
      if (existingPrice && typeof existingPrice !== 'string') {
        newPriceId = existingPrice.id;
        newPrice = existingPrice.unit_amount ? existingPrice.unit_amount / 100 : 0;
      }
    }

    return res.status(200).json({
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description || '',
        price: newPrice,
        priceId: newPriceId,
        images: updatedProduct.images || [],
        stock: parseInt(updatedProduct.metadata.stock || '0'),
        active: updatedProduct.active,
        metadata: updatedProduct.metadata,
        updatedAt: Date.now()
      }
    });
  }

  // DELETE - Supprimer un produit (le désactiver)
  if (req.method === 'DELETE') {
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID du produit requis'
      });
    }

    const deletedProduct = await stripe.products.update(productId, {
      active: false
    });

    return res.status(200).json({
      success: true,
      message: 'Produit désactivé avec succès',
      productId: deletedProduct.id
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Méthode non autorisée'
  });
}

// ===== HANDLER: STATS =====
async function handleStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
  }

  if (!requireAuth(req, res)) {
    return;
  }

  console.log('📊 Récupération des statistiques Stripe...');

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    status: 'complete',
  });

  const totalOrders = sessions.data.length;

  const totalRevenue = sessions.data.reduce((sum, session) => {
    return sum + (session.amount_total || 0);
  }, 0) / 100;

  const uniqueCustomers = new Set(
    sessions.data
      .map(session => session.customer_details?.email)
      .filter(email => email !== null && email !== undefined)
  );
  const totalCustomers = uniqueCustomers.size;

  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });
  const totalProducts = products.data.length;

  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60);

  const recentSessions = sessions.data.filter(session =>
    (session.created || 0) >= sevenDaysAgo
  );

  const recentRevenue = recentSessions.reduce((sum, session) => {
    return sum + (session.amount_total || 0);
  }, 0) / 100;

  return res.status(200).json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts,
      totalCustomers,
      recentOrders: recentSessions.length,
      recentRevenue: recentRevenue.toFixed(2),
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00',
    }
  });
}

// ===== HANDLER: SEND EMAIL =====
async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!requireAuth(req, res)) {
    return;
  }

  const { orderId, trackingNumber } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'orderId est requis'
    });
  }

  console.log('📧 Envoi email pour commande:', orderId);

  const session = await stripe.checkout.sessions.retrieve(orderId);

  if (!session.customer_details?.email) {
    return res.status(400).json({
      success: false,
      error: 'Aucun email client trouvé pour cette commande'
    });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(orderId, {
    limit: 100,
    expand: ['data.price.product'],
  });

  const customerEmail = session.customer_details.email;
  const customerName = session.customer_details.name || 'Client';
  const orderAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';

  console.log('📧 Destinataire de l\'email:', customerEmail);

  const productsList = lineItems.data.map(item => {
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
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📦 Commande expédiée !</h1>
            </td>
          </tr>
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

  const emailData = await resend.emails.send({
    from: 'Les Senteurs d\'Amira <onboarding@resend.dev>',
    to: [customerEmail],
    subject: '📦 Votre commande a été expédiée !',
    html: emailHtml,
  });

  console.log('✅ Email envoyé avec succès:', emailData.data?.id);

  return res.status(200).json({
    success: true,
    message: `Email envoyé à ${customerEmail}`,
    emailId: emailData.data?.id
  });
}

// ===== HANDLER: SEND DELIVERY EMAIL =====
async function handleSendDeliveryEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!requireAuth(req, res)) {
    return;
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'orderId est requis'
    });
  }

  console.log('📧 Envoi email de réception pour commande:', orderId);

  const session = await stripe.checkout.sessions.retrieve(orderId);

  if (!session.customer_details?.email) {
    return res.status(400).json({
      success: false,
      error: 'Aucun email client trouvé pour cette commande'
    });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(orderId, {
    limit: 100,
    expand: ['data.price.product'],
  });

  const customerEmail = session.customer_details.email;
  const customerName = session.customer_details.name || 'Client';

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
          <tr>
            <td style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Commande bien reçue !</h1>
            </td>
          </tr>
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
}

// ===== HANDLER: UPDATE ORDER STATUS =====
async function handleUpdateOrderStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!requireAuth(req, res)) {
    return;
  }

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
}
