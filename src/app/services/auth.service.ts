import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoginRequest, LoginResponse, AdminUser, JWTPayload } from '../models/auth.model';
import { environment } from '../../environments/environment';

/**
 * Service de gestion de l'authentification admin
 *
 * Fonctionnalités :
 * - Login avec email/password
 * - Stockage sécurisé du JWT dans localStorage
 * - Décodage et validation du JWT
 * - Vérification de l'authentification
 * - Logout
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'admin_token';

  // BehaviorSubject pour suivre l'état d'authentification
  private currentUserSubject: BehaviorSubject<AdminUser | null>;
  public currentUser$: Observable<AdminUser | null>;

  constructor(private http: HttpClient) {
    // Initialiser avec le token stocké s'il existe
    const storedUser = this.getUserFromToken();
    this.currentUserSubject = new BehaviorSubject<AdminUser | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Connexion admin
   * @param email - Email de l'admin
   * @param password - Mot de passe
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/admin/login`,
      request
    ).pipe(
      map(response => {
        if (response.success && response.token) {
          // Stocker le token
          this.setToken(response.token);

          // Décoder et mettre à jour l'utilisateur courant
          const user = this.getUserFromToken();
          this.currentUserSubject.next(user);

          console.log('✅ Token stocké et utilisateur authentifié');
        }
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    // Supprimer le token
    localStorage.removeItem(this.tokenKey);

    // Réinitialiser l'utilisateur courant
    this.currentUserSubject.next(null);

    console.log('🚪 Déconnexion réussie');
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Vérifier si le token est expiré
    return !this.isTokenExpired(token);
  }

  /**
   * Obtenir le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Stocker le token JWT
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Décoder le JWT et récupérer les informations utilisateur
   */
  private getUserFromToken(): AdminUser | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return {
        email: payload.email,
        role: payload.role
      };
    } catch (error) {
      console.error('❌ Erreur décodage token:', error);
      return null;
    }
  }

  /**
   * Décoder le JWT (sans vérification de signature)
   */
  private decodeToken(token: string): JWTPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT invalide');
      }

      // Décoder la partie payload (base64url)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Impossible de décoder le token');
    }
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);

      return payload.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = `Erreur serveur: ${error.status}`;
      }
    }

    console.error('❌ Erreur AuthService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
