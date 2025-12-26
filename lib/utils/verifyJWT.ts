/**
 * Utilitaire pour vérifier le JWT dans les requêtes admin
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';

export interface JWTPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Vérifie le JWT dans le header Authorization
 * @returns Le payload décodé si le token est valide, sinon undefined
 */
export function verifyJWT(req: VercelRequest): JWTPayload | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authHeader.substring(7); // Enlever "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT invalide:', error);
    return undefined;
  }
}

/**
 * Middleware pour protéger les routes admin
 * Retourne true si authentifié, sinon envoie une réponse 401
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  const payload = verifyJWT(req);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Non authentifié. Token manquant ou invalide.'
    });
    return false;
  }

  if (payload.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Accès refusé. Rôle admin requis.'
    });
    return false;
  }

  return true;
}
