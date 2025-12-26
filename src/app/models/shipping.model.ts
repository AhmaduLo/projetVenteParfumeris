/**
 * Modèles pour la gestion des expéditions
 */

import { ShippingStatus } from './order.model';

export interface UpdateShippingStatusRequest {
  orderId: string;
  shippingStatus: ShippingStatus;
}

export interface UpdateShippingStatusResponse {
  success: boolean;
  message?: string;
  shippingStatus?: ShippingStatus;
  error?: string;
}

export interface SendDeliveryEmailRequest {
  orderId: string;
}

export interface SendDeliveryEmailResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  error?: string;
}
