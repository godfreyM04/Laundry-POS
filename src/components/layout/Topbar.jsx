import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { isSupabaseLive } from '../../lib/supabase';
import { ROLE_LABELS, USER_ROLES } from '../../lib/constants';
import { 
  Bell, 
  Database, 
  UserCheck, 
  LogOut, 
  ChevronDown, 
  Check, 
  Sparkles, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';

export function Topbar({ activeScreenTitle, onOpenConfig, onSelectOrder }) {
  const { currentUser, role, demoUsers, switchDemoRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const isLive = isSupabaseLive();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">
          {activeScreenTitle}
        </h2>
      </div>

      <div className="topbar-right">
        {/* Supabase Status Badge */}
        <button
          type="button"
          onClick={onOpenConfig}
          className={`btn btn-sm ${isLive ? 'btn-secondary' : 'btn-secondary'}`}
          style={{
            borderColor: isLive ? '#10b981' : '#f59e0b',
            background: isLive ? '#f0fdf4' : '#fffbeb',
            color: isLive ? '#065f46' : '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Click to check or configure Supabase connection"
        >
          <Database size={13} color={isLive ? '#10b981' : '#f59e0b'} />
          <span>{isLive ? 'Supabase Connected' : 'Demo DB Mode'}</span>
        </button>

        {/* Quick Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserCheck size={14} color="var(--primary-600)" />
            <span style={{ fontWeight: 600 }}>{ROLE_LABELS[role] || role}</span>
            <ChevronDown size={13} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: '#ffffff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                width: '260px',
                zIndex: 100,
                padding: '6px'
              }}
              onClick={() => setShowRoleMenu(false)}
            >
              <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Switch Active Role
              </div>
              {demoUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => switchDemoRole(user.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: user.role === role ? 'var(--bg-hover)' : 'transparent',
                    color: user.role === role ? 'var(--primary-700)' : 'var(--text-main)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ROLE_LABELS[user.role]}</div>
                  </div>
                  {user.role === role && <Check size={16} color="var(--primary-600)" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn-icon-only btn-secondary"
            style={{ position: 'relative' }}
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px white'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: '#ffffff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                width: '340px',
                maxHeight: '420px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Operational Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    style={{ fontSize: '11px', color: 'var(--primary-700)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, maxHeight: '300px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.order_id && onSelectOrder) {
                          onSelectOrder(notif.order_id);
                          setShowNotifMenu(false);
                        }
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: notif.is_read ? '#ffffff' : '#f0fdfa',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: notif.is_read ? 500 : 700, fontSize: '13px', color: 'var(--text-main)' }}>
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary-600)' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {formatDateTime(notif.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              {currentUser?.full_name?.split('(')[0]?.trim() || 'Staff User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {ROLE_LABELS[role]}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon-only btn-ghost"
            onClick={logout}
            title="Sign out / Exit"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
