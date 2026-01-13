/**
 * Génère un numéro de commande unique au format CMD-JJMMAAAA-XXX
 * Exemple: CMD-13012026-001
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

/**
 * Génère un numéro de commande unique
 * Format: CMD-JJMMAAAA-XXX
 * - CMD: Préfixe fixe
 * - JJMMAAAA: Date du jour (13012026 pour 13 janvier 2026)
 * - XXX: Numéro séquentiel du jour (001, 002, 003...)
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();

  // Format de la date: JJMMAAAA
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  const dateStr = `${day}${month}${year}`;

  // Préfixe pour rechercher les commandes du jour
  const prefix = `CMD-${dateStr}-`;

  try {
    // Récupérer toutes les sessions de checkout du jour
    // On utilise les métadonnées Stripe pour stocker le numéro de commande
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    const endOfDay = startOfDay + 86400; // +24h

    const sessions = await stripe.checkout.sessions.list({
      created: {
        gte: startOfDay,
        lt: endOfDay
      },
      limit: 100
    });

    // Compter combien de commandes ont déjà un numéro aujourd'hui
    const todayOrders = sessions.data.filter(
      session => session.metadata?.orderNumber?.startsWith(prefix)
    );

    // Numéro séquentiel = nombre de commandes du jour + 1
    const sequenceNumber = todayOrders.length + 1;
    const sequenceStr = String(sequenceNumber).padStart(3, '0');

    return `${prefix}${sequenceStr}`;
  } catch (error) {
    console.error('Erreur génération numéro de commande:', error);
    // En cas d'erreur, générer un numéro avec timestamp pour garantir l'unicité
    const timestamp = Date.now().toString().slice(-6);
    return `CMD-${dateStr}-${timestamp}`;
  }
}

/**
 * Stocke le numéro de commande dans les métadonnées de la session Stripe
 */
export async function storeOrderNumber(sessionId: string, orderNumber: string): Promise<void> {
  try {
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        orderNumber
      }
    });
    console.log(`✅ Numéro de commande ${orderNumber} stocké pour la session ${sessionId}`);
  } catch (error) {
    console.error('Erreur stockage numéro de commande:', error);
  }
}

/**
 * Récupère le numéro de commande depuis les métadonnées Stripe
 */
export async function getOrderNumber(sessionId: string): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.metadata?.orderNumber || sessionId.substring(0, 20);
  } catch (error) {
    console.error('Erreur récupération numéro de commande:', error);
    return sessionId.substring(0, 20);
  }
}
