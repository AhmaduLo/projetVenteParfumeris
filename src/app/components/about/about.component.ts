import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant À propos avec l'histoire et les valeurs de la boutique
 */
@Component({
    selector: 'app-about',
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  /** Valeurs de la boutique */
  values = [
    {
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Qualité Premium',
      description: 'Des produits soigneusement sélectionnés auprès des meilleurs artisans'
    },
    {
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Tradition',
      description: 'Des recettes ancestrales transmises de génération en génération'
    },
    {
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      title: 'Passion',
      description: 'Un amour profond pour l\'art de la parfumerie orientale'
    },
    {
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Authenticité',
      description: 'Des ingrédients naturels provenant directement de leur région d\'origine'
    }
  ];
}
