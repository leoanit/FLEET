import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  notifications: NotificationItem[];
  notificationsOpen: boolean;
  activeNotificationsCount: number;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  addNotification: (type: 'info' | 'warning' | 'alert' | 'success', title: string, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  toast: NotificationItem | null;
  setToast: (toast: NotificationItem | null) => void;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'alert',
    title: 'Operator Suspended',
    message: 'Joseph Otieno suspended due to expired NTSA CDL and physical medical credentials.',
    time: '3 min ago',
    read: false,
  },
  {
    id: 'n-2',
    type: 'warning',
    title: 'Preventative Maintenance Due',
    message: 'Utility D-Max (KBZ 110S) has exceeded the 5,000 km oil change mileage limit.',
    time: '15 min ago',
    read: false,
  },
  {
    id: 'n-3',
    type: 'success',
    title: 'Mombasa Port Cargo Departed',
    message: 'Long-haul Scania flatbed dispatched under operator Peter Kiprop.',
    time: '1 hour ago',
    read: false,
  },
];

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  
  notifications: initialNotifications,
  notificationsOpen: false,
  activeNotificationsCount: initialNotifications.length,
  
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  closeNotifications: () => set({ notificationsOpen: false }),
  
  addNotification: (type, title, message) => set((state) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      time: 'Just Now',
      read: false,
    };
    const updated = [newNotif, ...state.notifications];
    return {
      notifications: updated,
      activeNotificationsCount: updated.filter(n => !n.read).length,
      toast: newNotif, // trigger toast popup automatically!
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return {
      notifications: updated,
      activeNotificationsCount: updated.filter(n => !n.read).length,
    };
  }),
  
  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, read: true }));
    return {
      notifications: updated,
      activeNotificationsCount: 0,
    };
  }),
  
  deleteNotification: (id) => set((state) => {
    const updated = state.notifications.filter(n => n.id !== id);
    return {
      notifications: updated,
      activeNotificationsCount: updated.filter(n => !n.read).length,
    };
  }),
  
  clearAllNotifications: () => set({
    notifications: [],
    activeNotificationsCount: 0,
    notificationsOpen: false,
  }),
  
  toast: null,
  setToast: (toast) => set({ toast }),
}));
