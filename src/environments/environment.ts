/**
 * Environnement de développement
 * Utilisé avec `ng serve`
 */
export const environment = {
  production: false,

  // URL de l'API - Utilise l'API locale pour le développement
  // Pour lancer l'API locale: vercel dev --listen 3000
  apiUrl: 'http://localhost:3000/api',

  // Nom de l'application
  appName: 'Parfums & Incenses d\'Orient',

  // Version
  version: '1.0.0',
};
