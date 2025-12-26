/**
 * Modèles pour l'envoi d'emails
 */

export interface SendEmailRequest {
  orderId: string;
  trackingNumber?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  error?: string;
}
