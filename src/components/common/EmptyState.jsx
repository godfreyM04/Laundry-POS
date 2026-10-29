import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title = 'No records found', description, action }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-medium)',
      margin: '8px 0'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        marginBottom: '14px'
      }}>
        <Icon size={26} />
      </div>
      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
        {title}
      </h4>
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: action ? '16px' : '0' }}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '12px',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #e2e8f0',
        borderTopColor: 'var(--primary-600)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite'
      }} />
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{text}</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
