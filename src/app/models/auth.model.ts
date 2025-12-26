/**
 * Modèles pour l'authentification admin
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
}

export interface AdminUser {
  email: string;
  role: 'admin';
}

export interface JWTPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}
