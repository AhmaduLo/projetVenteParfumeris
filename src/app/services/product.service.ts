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
    nom: "& Les senteurs D'amira &",
    telephone: '+33 6 12 34 56 78',
    email: 'contact@parfums-orient.fr',
    whatsapp: '+33 6 12 34 56 78',
    adresse: '123 Rue de la Paix, 75002 Paris'
  };

  /**
   * Catalogue de produits
   */
  // private products: Product[] = [
  //   {
  //     id: 1,
  //     nom: 'Oud Royal',
  //     categorie: 'parfum',
  //     prix: 45,
  //     image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop',
  //     description: 'Un parfum oriental luxueux aux notes profondes d\'oud. Captivant et mystérieux, il évoque les palais d\'Orient et les souks parfumés.',
  //     caracteristiques: {
  //       contenance: '50ml',
  //       origine: 'Grasse, France',
  //       notes: 'Oud, Santal, Ambre',
  //       duree: '8-10 heures'
  //     },
  //     nouveau: true
  //   },
  //   {
  //     id: 2,
  //     nom: 'Rose de Damas',
  //     categorie: 'parfum',
  //     prix: 38,
  //     image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?w=500&h=500&fit=crop',
  //     description: 'La quintessence de la rose damascène. Délicat et raffiné, ce parfum célèbre la reine des fleurs dans toute sa splendeur.',
  //     caracteristiques: {
  //       contenance: '50ml',
  //       origine: 'Damas, Syrie',
  //       notes: 'Rose, Jasmin, Musc blanc',
  //       duree: '6-8 heures'
  //     },
  //     nouveau: true
  //   },
  //   {
  //     id: 3,
  //     nom: 'Ambre Noir',
  //     categorie: 'parfum',
  //     prix: 52,
  //     image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&h=500&fit=crop',
  //     description: 'Une composition boisée et ambrée pour les âmes audacieuses. Profond, sensuel et inoubliable.',
  //     caracteristiques: {
  //       contenance: '75ml',
  //       origine: 'Paris, France',
  //       notes: 'Ambre, Bois de cèdre, Vanille',
  //       duree: '10-12 heures'
  //     },
  //     nouveau: false
  //   },
  //   {
  //     id: 4,
  //     nom: 'Bakhoor Premium',
  //     categorie: 'incense',
  //     prix: 15,
  //     image: 'https://images.unsplash.com/photo-1602874801006-93f2fb02ed8b?w=500&h=500&fit=crop',
  //     description: 'Encens traditionnel du Moyen-Orient. Parfait pour créer une ambiance chaleureuse et spirituelle dans votre intérieur.',
  //     caracteristiques: {
  //       contenance: '40g',
  //       origine: 'Dubaï, EAU',
  //       duree: '30-45 minutes par unité'
  //     },
  //     nouveau: true
  //   },
  //   {
  //     id: 5,
  //     nom: 'Santal Mystique',
  //     categorie: 'incense',
  //     prix: 12,
  //     image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop',
  //     description: 'Bâtonnets d\'encens naturels au bois de santal. Apaisant et méditatif, idéal pour la relaxation et la méditation.',
  //     caracteristiques: {
  //       contenance: '20 bâtonnets',
  //       origine: 'Mysore, Inde',
  //       duree: '45 minutes par bâtonnet'
  //     },
  //     nouveau: false
  //   },
  //   {
  //     id: 6,
  //     nom: 'Lavande Provence',
  //     categorie: 'incense',
  //     prix: 10,
  //     image: 'https://images.unsplash.com/photo-1611251135414-9c0d27e62440?w=500&h=500&fit=crop',
  //     description: 'Cônes d\'encens à la lavande de Provence. Frais et apaisant, parfait pour purifier l\'air et favoriser le sommeil.',
  //     caracteristiques: {
  //       contenance: '30 cônes',
  //       origine: 'Provence, France',
  //       duree: '20 minutes par cône'
  //     },
  //     nouveau: false
  //   }
  // ];

  constructor() { }

  /**
   * Récupère tous les produits du catalogue
   */
  // getAllProducts(): Product[] {
  //   return this.products;
  // }

  /**
   * Récupère un produit par son ID
   */
  // getProductById(id: number): Product | undefined {
  //   return this.products.find(p => p.id === id);
  // }

  /**
   * Récupère les produits par catégorie
   */
  // getProductsByCategory(categorie: 'parfum' | 'incense'): Product[] {
  //   return this.products.filter(p => p.categorie === categorie);
  // }

  /**
   * Récupère les informations de contact
   */
  getContactInfo(): ContactInfo {
    return this.contactInfo;
  }
}
