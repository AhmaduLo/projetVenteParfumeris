/**
 * Environnement de développement
 * Utilisé avec `ng serve`
 */
export const environment = {
  production: false,

  // URL de l'API Vercel (pointe vers production temporairement)
  // TODO: Remettre http://localhost:3000/api quand vercel dev fonctionne
  apiUrl: 'https://boutique-parfums.vercel.app/api',

  // Nom de l'application
  appName: 'Parfums & Incenses d\'Orient',

  // Version
  version: '1.0.0',
};
