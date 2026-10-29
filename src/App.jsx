import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginScreen } from './modules/auth/LoginScreen';
import { SupabaseConfigModal } from './components/layout/SupabaseConfigModal';
import { LoadingSpinner } from './components/common/EmptyState';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <LoadingSpinner text="Starting LaundryPOS Workstation..." />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginScreen onOpenConfig={() => setIsConfigOpen(true)} />
        <SupabaseConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      </>
    );
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
