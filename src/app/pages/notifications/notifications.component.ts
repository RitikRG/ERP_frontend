import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { NotificationItem } from '../../core/models/notification';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div class="header-row">
        <h2>Notifications</h2>
        <button class="mark-all-btn" (click)="markAllAsRead()" *ngIf="unreadCount > 0">
          Mark All as Read
        </button>
      </div>

      <div class="list-wrapper">
        <div *ngIf="notifications.length === 0" class="empty-state">
          No notifications found.
        </div>

        <div *ngFor="let notif of notifications" 
             class="notification-card" 
             [class.unread]="!notif.isRead"
             (click)="handleNotificationClick(notif)">
          <div class="card-content">
            <div class="card-header">
              <h3>{{ notif.title }}</h3>
              <span class="time">{{ notif.createdAt | date:'medium' }}</span>
            </div>
            <p>{{ notif.body }}</p>
          </div>
          <div class="status-indicator" *ngIf="!notif.isRead"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .mark-all-btn {
      padding: 8px 16px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .mark-all-btn:hover { background: #0052a3; }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #777;
    }
    .notification-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .notification-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .notification-card.unread {
      background: #f4f8ff;
      border-color: #cce0ff;
    }
    .card-content h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #333;
    }
    .card-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .time {
      font-size: 12px;
      color: #999;
    }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #0066cc;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(n => this.notifications = n);
    this.notificationService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.notificationService.fetchNotifications(1, 50).subscribe();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  handleNotificationClick(notif: NotificationItem) {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }
    if (notif.deeplink) {
      this.router.navigateByUrl(notif.deeplink);
    }
  }
}
