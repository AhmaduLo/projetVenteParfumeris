import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Durée en ms (0 = manuel)
}

/**
 * Service de gestion des notifications
 * Remplace les alert() natifs par des modals personnalisés
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$: Observable<Notification | null> = this.notificationSubject.asObservable();

  constructor() {}

  /**
   * Affiche une notification de succès
   */
  success(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Affiche une notification d'erreur
   */
  error(message: string, duration: number = 0): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Affiche une notification d'avertissement
   */
  warning(message: string, duration: number = 0): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Affiche une notification d'information
   */
  info(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Affiche une notification
   */
  private show(notification: Notification): void {
    this.notificationSubject.next(notification);
  }

  /**
   * Ferme la notification actuelle
   */
  close(): void {
    this.notificationSubject.next(null);
  }
}
