import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant Hero - Section d'accueil avec image de fond
 */
@Component({
    selector: 'app-hero',
    imports: [CommonModule],
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.scss']
})
export class HeroComponent {

  /**
   * Scroll vers la section catalogue
   */
  scrollToCatalogue(): void {
    const element = document.getElementById('catalogue');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
