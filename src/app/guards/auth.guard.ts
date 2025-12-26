import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes admin
 *
 * Vérifie si l'utilisateur est authentifié
 * Si non, redirige vers la page de login
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (authService.isAuthenticated()) {
    return true;
  }

  // Rediriger vers la page de login
  console.log('🚫 Accès refusé - Redirection vers login');
  router.navigate(['/admin/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};
