/**
 * Vercel Serverless Function
 * API de connexion admin avec JWT
 *
 * Route : POST /api/admin/login
 * Body : { email: string, password: string }
 *
 * Sécurité :
 * - Vérification email/password hashé avec bcrypt
 * - Génération de JWT avec expiration
 * - CORS sécurisé
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '../../lib/utils/rateLimiter';

// Configuration admin (à déplacer dans des variables d'environnement en production)
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'admin@example.com';
const ADMIN_PASSWORD_HASH = process.env['ADMIN_PASSWORD_HASH'] || '$2a$10$YourHashedPasswordHere';
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h'; // Le token expire après 24h

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

  try {
    // ===== VÉRIFICATION RATE LIMITING =====
    const rateLimitCheck = checkRateLimit(req);

    if (!rateLimitCheck.allowed) {
      console.log('⚠️ Tentative de connexion bloquée (trop de tentatives)');
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // ===== VALIDATION DES DONNÉES =====
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    // ===== VÉRIFICATION EMAIL =====
    if (email !== ADMIN_EMAIL) {
      // Attendre un peu pour éviter les attaques par timing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Enregistrer la tentative échouée
      recordFailedAttempt(req);
      console.log('❌ Tentative de connexion échouée');
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // ===== VÉRIFICATION MOT DE PASSE =====
    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isPasswordValid) {
      // Enregistrer la tentative échouée
      recordFailedAttempt(req);
      console.log('❌ Tentative de connexion échouée');
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // ===== GÉNÉRATION DU JWT =====
    const payload = {
      email: email,
      role: 'admin',
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION
    });

    // Réinitialiser les tentatives après connexion réussie
    resetAttempts(req);
    console.log('✅ Connexion admin réussie');

    // ===== RETOURNER LE TOKEN =====
    return res.status(200).json({
      success: true,
      token: token,
      message: 'Connexion réussie'
    });

  } catch (error: any) {
    console.error('❌ Erreur login admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion',
      message: error.message
    });
  }
}
