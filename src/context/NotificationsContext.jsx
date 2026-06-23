import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';

import { api } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationsContext = createContext(null);

const normalizeNotification = (n = {}) => ({
  id: n.id,
  title: n.title || '',
  message: n.message || '',
  type: n.type ?? n.notification_type ?? 'system',
  time: n.time ?? n.created_at ?? new Date().toISOString(),
  isRead: n.isRead ?? n.is_read ?? false,
});

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const pushRealtimeNotification = useCallback((data) => {
    const incoming = normalizeNotification(data);
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === incoming.id);
      if (exists) return prev;
      return [incoming, ...prev];
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/');
      const rows = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
        ? response.data.results
        : [];
      setNotifications(rows.map(normalizeNotification));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const WS_BASE_URL = import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
  const token = localStorage.getItem('token');

  useWebSocket(
    token ? `${WS_BASE_URL}/ws/notifications/` : null,
    (data) => {
      pushRealtimeNotification(data);
    },
    (error) => {
      console.error('Notification websocket error:', error);
    },
  );

  const clearNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications/clear_all/');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      loading,
      clearNotification,
      clearAllNotifications,
      fetchNotifications,
    }),
    [notifications, loading, clearNotification, clearAllNotifications, fetchNotifications],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      notifications: [],
      loading: false,
      clearNotification: async () => {},
      clearAllNotifications: async () => {},
      fetchNotifications: async () => {},
    };
  }
  return ctx;
};

export default NotificationsContext;
