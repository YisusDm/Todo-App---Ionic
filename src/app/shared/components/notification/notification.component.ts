import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class NotificationComponent implements OnInit {
  notification$ = this.notificationService.notification$;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {}

  dismiss() {
    this.notificationService.dismiss();
  }
}
