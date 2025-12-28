import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireAuth } from '../../lib/utils/verifyJWT';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

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

  // ===== VÉRIFICATION AUTHENTIFICATION =====
  if (!requireAuth(req, res)) {
    return; // requireAuth a déjà envoyé la réponse 401/403
  }

  try {

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

      // Créer le produit
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

      // Créer le prix associé
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Convertir en centimes
        currency: 'eur'
      });

      // Mettre à jour le produit avec le prix par défaut
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

      // Mettre à jour le produit
      const updateData: Stripe.ProductUpdateParams = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (images !== undefined) updateData.images = images;

      // Gestion du stock et de l'état actif
      if (stock !== undefined || metadata !== undefined) {
        const finalStock = stock !== undefined ? stock : 0;
        updateData.metadata = {
          ...(metadata || {}),
          stock: String(finalStock)
        };

        // Si stock = 0, forcer active = false
        // Si stock > 0 et active n'est pas explicitement défini, activer le produit
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

      // Si le prix a changé, créer un nouveau prix
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
        // Récupérer le prix existant
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

      // Stripe ne permet pas de supprimer un produit, on le désactive
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

  } catch (error: any) {
    console.error('Erreur API produits:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    });
  }
}
