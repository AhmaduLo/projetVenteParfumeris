/**
 * Environnement de développement
 * Utilisé avec `ng serve`
 */
export const environment = {
  production: false,

  // URL de l'API - Utilise l'API de production même en développement local
  // Car nous n'avons pas de serveur local pour les Vercel Functions
  apiUrl: 'https://les-senteurs-d-amira.vercel.app/api',

  // Nom de l'application
  appName: 'Parfums & Incenses d\'Orient',

  // Version
  version: '1.0.0',
};
