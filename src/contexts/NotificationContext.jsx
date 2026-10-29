import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationAsRead } from '../lib/api';
import { supabase, isSupabaseLive } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { role, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(role);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [role]);

  useEffect(() => {
    loadNotifications();

    // Setup Supabase Realtime if live
    if (isSupabaseLive()) {
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const newNotif = payload.new;
            // Check if notification belongs to user's role
            if (!newNotif.recipient_role || newNotif.recipient_role === role || role === 'admin') {
              setNotifications(prev => [newNotif, ...prev]);
              // Trigger pop toast
              showToast({
                title: newNotif.title,
                message: newNotif.message,
                type: 'info'
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // In local demo mode, poll every 20 seconds
      const interval = setInterval(loadNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [loadNotifications, role]);

  const showToast = useCallback(({ title, message, type = 'info', duration = 5000 }) => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      for (const n of notifications.filter(item => !item.is_read)) {
        await markNotificationAsRead(n.id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const value = {
    notifications,
    unreadCount,
    toast,
    showToast,
    hideToast,
    markAsRead,
    markAllRead,
    refreshNotifications: loadNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
