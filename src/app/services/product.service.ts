import { Injectable } from '@angular/core';
import { Product, ContactInfo } from '../models/product.model';

/**
 * Service de gestion des produits et des informations de contact
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {

  /**
   * Informations de contact de la boutique
   */
  private readonly contactInfo: ContactInfo = {
    nom: "Les Senteurs d'Amira",
    telephone: '+33 6 12 34 56 78',
    email: 'contact@lessenteursdamira.fr',
    whatsapp: '+33 6 12 34 56 78',
    adresse: '123 Rue de la Paix, 75002 Paris'
  };

  constructor() { }

  /**
   * Récupère les informations de contact
   */
  getContactInfo(): ContactInfo {
    return this.contactInfo;
  }
}
