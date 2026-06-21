import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from 'react';

import { api } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationsContext = createContext(null);

const MAX_NOTIFICATIONS = 20;

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const pushRealtimeNotification = (data) => {
  setNotifications((prev) => {
    const exists = prev.some(
      (n) => n.id === data.id
    );

    if (exists) {
      return prev;
    }

    return [data, ...prev];
  });
};

const fetchNotifications = async () => {
  try {
    const response = await api.get('/notifications/');

    const data = response.data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.notification_type,
      time: n.created_at,
      isRead: n.is_read,
    }));

    setNotifications(data);
  } catch (error) {
    console.error(
      'Failed to fetch notifications:',
      error
    );
  }
};

useEffect(() => {
  fetchNotifications();
}, []);

const WS_BASE_URL =
  import.meta.env.VITE_WS_URL;

const token = localStorage.getItem('token');

useWebSocket(
  token
    ? `${WS_BASE_URL}/ws/notifications/`
    : null,
  (data) => {
    console.log(
      '🔔 Realtime notification received:',
      data
    );

    pushRealtimeNotification(data);
  }
);
  



  const pushNotification = useCallback((title, message, type = 'info') => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      type,
      time: new Date().toISOString(),
    };
    setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

 const value = {
  notifications,
  pushNotification,
  clearNotification,
  clearAllNotifications,
  fetchNotifications,
};

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    // Fail soft rather than crash the app if a page renders outside the
    // provider during incremental rollout — bell will just show empty state.
    return {
      notifications: [],
      pushNotification: () => {},
      clearNotification: () => {},
      clearAllNotifications: () => {},
      fetchNotifications: () => {},
    };
  }
  return ctx;
};

export default NotificationsContext;