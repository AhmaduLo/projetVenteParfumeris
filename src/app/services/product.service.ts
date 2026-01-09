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
    telephone: '0758793064',
    email: 'lessenteursdamira@gmail.com',
    whatsapp: '0758793064',
    adresse: 'Paris'
  };

  constructor() { }

  /**
   * Récupère les informations de contact
   */
  getContactInfo(): ContactInfo {
    return this.contactInfo;
  }
}
