import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { environment } from '../../enviornment/enviornment';
import { NotificationItem } from '../core/models/notification';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private swPush: SwPush,
    private authService: AuthService
  ) {}

  public async requestPermissionAndSubscribe() {
    if (!this.swPush.isEnabled) {
      console.warn('Service Worker Push is not enabled');
      return;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey
      });
      
      const subPayload = {
        deviceId: this.authService.getDeviceId(),
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      };

      this.http.post(`${this.apiUrl}/subscriptions`, subPayload, { withCredentials: true })
        .subscribe({
          next: () => console.log('Push subscription registered successfully'),
          error: (err) => console.error('Failed to register push subscription', err)
        });

    } catch (err) {
      console.error('Could not subscribe to notifications', err);
    }
  }

  public fetchNotifications(page = 1, limit = 20) {
    return this.http.get<{ notifications: NotificationItem[], unreadCount: number }>(
      `${this.apiUrl}/me?page=${page}&limit=${limit}`,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.notificationsSubject.next(res.notifications);
        this.unreadCountSubject.next(res.unreadCount);
      }),
      catchError(err => {
        console.error('Error fetching notifications', err);
        return of({ notifications: [], unreadCount: 0 });
      })
    );
  }

  public markAsRead(deliveryId: string) {
    return this.http.patch(`${this.apiUrl}/${deliveryId}/read`, {}, { withCredentials: true }).pipe(
      tap(() => {
        const list = this.notificationsSubject.value.map(n => 
          n.id === deliveryId ? { ...n, isRead: true, status: 'read' as const } : n
        );
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
      })
    );
  }

  public markAllAsRead() {
    return this.http.patch(`${this.apiUrl}/read-all`, {}, { withCredentials: true }).pipe(
      tap(() => {
        const list = this.notificationsSubject.value.map(n => ({ ...n, isRead: true, status: 'read' as const }));
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(0);
      })
    );
  }
}
