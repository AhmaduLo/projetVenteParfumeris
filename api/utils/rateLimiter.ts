/**
 * Rate Limiter simple pour protéger contre les attaques par force brute
 * Stockage en mémoire (réinitialisé à chaque redémarrage de la fonction)
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

// Stockage en mémoire des tentatives par IP
const loginAttempts = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Nombre max de tentatives
const WINDOW_MS = 15 * 60 * 1000; // Fenêtre de 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // Blocage de 30 minutes après dépassement

/**
 * Nettoie les anciennes entrées (exécuté périodiquement)
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    // Supprimer les entrées expirées
    if (entry.blockedUntil && entry.blockedUntil < now) {
      loginAttempts.delete(ip);
    } else if (!entry.blockedUntil && (now - entry.firstAttempt) > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}

/**
 * Récupère l'IP du client depuis la requête Vercel
 */
function getClientIP(req: any): string {
  // Vercel fournit l'IP dans x-forwarded-for ou x-real-ip
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }

  return realIp || 'unknown';
}

/**
 * Vérifie si une IP est limitée
 * @returns { allowed: boolean, remainingAttempts?: number, retryAfter?: number }
 */
export function checkRateLimit(req: any): {
  allowed: boolean;
  remainingAttempts?: number;
  retryAfter?: number;
} {
  cleanupOldEntries();

  const ip = getClientIP(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  // Vérifier si l'IP est bloquée
  if (entry?.blockedUntil) {
    if (entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter
      };
    } else {
      // Le blocage a expiré, réinitialiser
      loginAttempts.delete(ip);
    }
  }

  // Vérifier le nombre de tentatives dans la fenêtre
  if (entry) {
    const timeElapsed = now - entry.firstAttempt;

    if (timeElapsed > WINDOW_MS) {
      // La fenêtre a expiré, réinitialiser
      loginAttempts.delete(ip);
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS
      };
    }

    // Calculer les tentatives restantes
    const remainingAttempts = MAX_ATTEMPTS - entry.attempts;

    if (remainingAttempts <= 0) {
      // Bloquer l'IP
      entry.blockedUntil = now + BLOCK_DURATION_MS;
      loginAttempts.set(ip, entry);

      return {
        allowed: false,
        retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000)
      };
    }

    return {
      allowed: true,
      remainingAttempts
    };
  }

  // Première tentative
  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS
  };
}

/**
 * Enregistre une tentative de connexion échouée
 */
export function recordFailedAttempt(req: any): void {
  const ip = getClientIP(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry) {
    entry.attempts += 1;
    loginAttempts.set(ip, entry);
  } else {
    loginAttempts.set(ip, {
      attempts: 1,
      firstAttempt: now
    });
  }
}

/**
 * Réinitialise les tentatives après une connexion réussie
 */
export function resetAttempts(req: any): void {
  const ip = getClientIP(req);
  loginAttempts.delete(ip);
}
