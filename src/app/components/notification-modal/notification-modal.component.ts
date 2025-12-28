import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

/**
 * Composant modal de notification
 * Affiche les notifications en remplacement des alert()
 */
@Component({
  selector: 'app-notification-modal',
  imports: [CommonModule],
  templateUrl: './notification-modal.component.html',
  styleUrl: './notification-modal.component.scss'
})
export class NotificationModalComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  isAnimating = false;
  private subscription?: Subscription;
  private autoCloseTimeout?: number;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      if (notification) {
        this.showNotification(notification);
      } else {
        this.hideNotification();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }

  /**
   * Affiche la notification
   */
  private showNotification(notification: Notification): void {
    this.notification = notification;
    this.isAnimating = true;

    // Auto-fermeture si durée définie
    if (notification.duration && notification.duration > 0) {
      if (this.autoCloseTimeout) {
        clearTimeout(this.autoCloseTimeout);
      }
      this.autoCloseTimeout = window.setTimeout(() => {
        this.close();
      }, notification.duration);
    }
  }

  /**
   * Masque la notification
   */
  private hideNotification(): void {
    this.isAnimating = false;
    setTimeout(() => {
      this.notification = null;
    }, 300);
  }

  /**
   * Ferme la notification
   */
  close(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
    this.notificationService.close();
  }

  /**
   * Retourne la classe CSS en fonction du type
   */
  getTypeClass(): string {
    return this.notification?.type || 'info';
  }

  /**
   * Retourne l'icône en fonction du type
   */
  getIcon(): string {
    switch (this.notification?.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
}
