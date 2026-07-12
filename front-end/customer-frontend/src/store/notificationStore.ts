import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning';

export type Notification = {
  id:      string;
  type:    NotificationType;
  message: string;
};

type NotificationStore = {
  notifications: Notification[];
  addNotification:    (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
