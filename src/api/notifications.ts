import {api} from './client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  is_read: boolean;
  created_at?: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

/** GET /notifications → { notifications, unread_count }. */
export async function fetchNotifications(): Promise<NotificationsResponse> {
  const {data} = await api.get<NotificationsResponse>('/notifications');
  return data;
}

/** PATCH /notifications/{id}/read — marque une notification comme lue. */
export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

/** POST /notifications/read-all — tout marquer comme lu. */
export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
