import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'info';
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$: Observable<Notification | null> = this.notificationSubject.asObservable();

  private notificationTimeout: any;

  show(message: string, type: 'success' | 'danger' | 'info' = 'info', duration: number = 5000) {
    // Limpiar timeout anterior
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    const icons = {
      success: 'check-circle-fill',
      danger: 'exclamation-triangle-fill',
      info: 'info-circle-fill',
    };

    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      icon: icons[type],
    };

    this.notificationSubject.next(notification);

    // Auto-dismiss después de la duración especificada
    this.notificationTimeout = setTimeout(() => {
      this.dismiss();
    }, duration);
  }

  dismiss() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationSubject.next(null);
  }
}
