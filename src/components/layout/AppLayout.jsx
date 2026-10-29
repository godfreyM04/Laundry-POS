import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { getOrders } from '../../lib/api';
import { ORDER_STATUS } from '../../lib/constants';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// Screen Modules
import { OverviewScreen } from '../../modules/overview/OverviewScreen';
import { POSScreen } from '../../modules/pos/POSScreen';
import { OrdersListScreen } from '../../modules/orders/OrdersListScreen';
import { ProcessingQueueScreen } from '../../modules/processing/ProcessingQueueScreen';
import { PaymentsScreen } from '../../modules/payments/PaymentsScreen';
import { CustomersScreen } from '../../modules/customers/CustomersScreen';
import { ServicesScreen } from '../../modules/services/ServicesScreen';
import { DeliveriesScreen } from '../../modules/deliveries/DeliveriesScreen';
import { ReportsScreen } from '../../modules/reports/ReportsScreen';
import { StaffScreen } from '../../modules/staff/StaffScreen';
import { ReceiptModal } from '../common/ReceiptModal';
import { OrderDetailModal } from '../../modules/orders/OrderDetailModal';

export function AppLayout() {
  const { role, isAdmin, isCashier, isLaundryStaff, isDeliveryStaff } = useAuth();
  const { toast, hideToast } = useNotifications();

  // Active Screen
  const [activeScreen, setActiveScreen] = useState(
    isAdmin ? 'overview' : isLaundryStaff ? 'processing' : isDeliveryStaff ? 'deliveries' : 'pos'
  );

  // Modals & Cross-screen targets
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [inspectedOrderId, setInspectedOrderId] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [orderCounts, setOrderCounts] = useState({ ready: 0, processing: 0 });

  // Update badge counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const ords = await getOrders();
        const ready = ords.filter(o => o.status === ORDER_STATUS.READY).length;
        const processing = ords.filter(o => o.status === ORDER_STATUS.PROCESSING).length;
        setOrderCounts({ ready, processing });
      } catch (err) {
        console.warn('Could not fetch order counts:', err);
      }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [activeScreen]);

  // Adjust screen if role changes and activeScreen not permitted
  useEffect(() => {
    if (!isAdmin && (activeScreen === 'reports' || activeScreen === 'staff' || activeScreen === 'services' || activeScreen === 'overview')) {
      setActiveScreen(isLaundryStaff ? 'processing' : isDeliveryStaff ? 'deliveries' : 'pos');
    }
  }, [role, isAdmin, isLaundryStaff, isDeliveryStaff]);

  const screenTitles = {
    overview: 'Business Operations Overview',
    pos: 'Point of Sale / Order Intake',
    orders: 'Orders Management & Handover',
    processing: 'Laundry Processing & Care Stages',
    payments: 'Payment Records & Receipts',
    customers: 'Customer Directory & Accounts',
    services: 'Services Catalogue & Pricing',
    deliveries: 'Delivery & Dispatch Operations',
    reports: 'Financial Reports & Balances',
    staff: 'Staff Access Control & Roles'
  };

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-medium)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          maxWidth: '380px',
          animation: 'modalIn 0.2s ease'
        }}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : toast.type === 'danger' ? (
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <Info size={20} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon-only btn-ghost"
            style={{ padding: '2px', color: 'var(--text-subtle)' }}
            onClick={hideToast}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        orderCounts={orderCounts}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          activeScreenTitle={screenTitles[activeScreen] || 'Dashboard'}
          onOpenConfig={() => setIsConfigOpen(true)}
          onSelectOrder={(ordId) => setInspectedOrderId(ordId)}
        />

        <main className="main-content">
          {activeScreen === 'overview' && (
            <OverviewScreen
              onNavigate={(screen) => setActiveScreen(screen)}
              onSelectOrder={(ordId) => setInspectedOrderId(ordId)}
            />
          )}

          {activeScreen === 'pos' && (
            <POSScreen
              onOrderCreated={(result) => {
                // optionally switch to orders or show dialog
              }}
              onNavigateToPayment={(ordId) => {
                setInspectedOrderId(ordId);
              }}
            />
          )}

          {activeScreen === 'orders' && (
            <OrdersListScreen
              onNavigateToPOS={() => setActiveScreen('pos')}
              onNavigateToPayment={(ordId) => {
                setInspectedOrderId(ordId);
              }}
              onShowReceipt={(p, ord) => {
                setActiveReceipt({ ...p, order_number: ord.order_number, customer_name: ord.customer_name });
              }}
            />
          )}

          {activeScreen === 'processing' && (
            <ProcessingQueueScreen
              onSelectOrder={(ordId) => setInspectedOrderId(ordId)}
            />
          )}

          {activeScreen === 'payments' && (
            <PaymentsScreen />
          )}

          {activeScreen === 'customers' && (
            <CustomersScreen
              onSelectOrder={(ordId) => setInspectedOrderId(ordId)}
            />
          )}

          {activeScreen === 'services' && (
            <ServicesScreen />
          )}

          {activeScreen === 'deliveries' && (
            <DeliveriesScreen
              onNavigateToPayment={(ordId) => setInspectedOrderId(ordId)}
            />
          )}

          {activeScreen === 'reports' && (
            <ReportsScreen />
          )}

          {activeScreen === 'staff' && (
            <StaffScreen />
          )}
        </main>
      </div>

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* Global Order Inspector */}
      {inspectedOrderId && (
        <OrderDetailModal
          orderId={inspectedOrderId}
          isOpen={Boolean(inspectedOrderId)}
          onClose={() => setInspectedOrderId(null)}
          onOpenPayment={(ordId) => {
            setInspectedOrderId(null);
            setActiveScreen('payments');
          }}
          onShowReceipt={(p, ord) => {
            setActiveReceipt({ ...p, order_number: ord.order_number, customer_name: ord.customer_name });
          }}
        />
      )}

      {/* Global Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={Boolean(activeReceipt)}
          onClose={() => setActiveReceipt(null)}
          receiptData={activeReceipt}
          orderData={{
            order_number: activeReceipt.order_number,
            customer_name: activeReceipt.customer_name
          }}
        />
      )}
    </div>
  );
}
