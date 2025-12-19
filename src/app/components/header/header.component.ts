import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant Header avec navigation et menu burger responsive
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  /** État du menu mobile */
  menuOpen = false;

  /** État du header sticky */
  isSticky = false;

  /**
   * Détecte le scroll pour appliquer l'effet sticky
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isSticky = window.scrollY > 50;
  }

  /**
   * Toggle le menu mobile
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Ferme le menu mobile
   */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /**
   * Scroll smooth vers une section
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.closeMenu();
    }
  }
}
