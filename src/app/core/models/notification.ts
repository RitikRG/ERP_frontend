export type NotificationType = 
  | 'online_order_created'
  | 'delivery_assigned'
  | 'delivery_otp_sent'
  | 'delivery_completed'
  | 'delivery_cancelled';

export interface NotificationItem {
  id: string;
  eventId: string;
  type: NotificationType;
  title: string;
  body: string;
  deeplink: string;
  orderId?: string;
  isRead: boolean;
  status: 'queued' | 'sent' | 'read';
  createdAt: string;
}

export interface NotificationUnreadSummary {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
