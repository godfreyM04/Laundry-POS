import React, { useState, useEffect } from 'react';
import { getOrders } from '../../lib/api';
import { formatCurrency, formatDateTime, formatPhone } from '../../lib/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HandoverModal } from '../orders/HandoverModal';
import { OrderDetailModal } from '../orders/OrderDetailModal';
import { Truck, MapPin, Phone, PackageCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export function DeliveriesScreen({ onNavigateToPayment }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [handoverTarget, setHandoverTarget] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      // Filter orders where fulfillment_type = 'delivery'
      const deliveryOrders = (data || []).filter(o => o.fulfillment_type === 'delivery');
      setOrders(deliveryOrders);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingDeliveries = orders.filter(o => o.status === 'ready' || o.status === 'processing' || o.status === 'received');
  const completedDeliveries = orders.filter(o => o.status === 'delivered' || o.status === 'closed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="var(--primary-600)" />
            Delivery Dispatch Operations
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track and verify door-to-door laundry fulfillment across active routes.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={loadDeliveries}>
          <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> Refresh
        </button>
      </div>

      {/* Deliveries Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading deliveries...
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px 24px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-muted)'
          }}>
            <Truck size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No delivery orders scheduled</div>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              When customers select delivery at POS order creation, deliveries appear here for dispatch.
            </p>
          </div>
        ) : (
          orders.map(ord => (
            <div
              key={ord.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-800)', fontSize: '14.5px' }}>
                    {ord.order_number}
                  </span>
                  <StatusBadge status={ord.status} />
                </div>

                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>
                  {ord.customer_name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <Phone size={12} /> {formatPhone(ord.customer_phone)}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--text-main)',
                  marginTop: '8px',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <MapPin size={14} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{ord.delivery_address || 'Address on customer file'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Order Amount:</span>
                  <strong>{formatCurrency(ord.total_amount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Balance Due:</span>
                  <strong style={{ color: ord.balance_due > 0 ? '#b91c1c' : '#047857' }}>
                    {formatCurrency(ord.balance_due)}
                  </strong>
                </div>
              </div>

              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelectedOrder(ord.id)}
                >
                  View Order
                </button>

                {ord.status === 'ready' ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => setHandoverTarget(ord)}
                  >
                    <PackageCheck size={13} /> Confirm Delivery
                  </button>
                ) : ord.status === 'delivered' || ord.status === 'closed' ? (
                  <span style={{ fontSize: '11.5px', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Completed
                  </span>
                ) : (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Awaiting Laundry Care
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          orderId={selectedOrder}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          onOpenPayment={(ordId) => {
            setSelectedOrder(null);
            if (onNavigateToPayment) onNavigateToPayment(ordId);
          }}
          onOpenHandover={(ord) => {
            setSelectedOrder(null);
            setHandoverTarget(ord);
          }}
        />
      )}

      {/* Handover Modal */}
      {handoverTarget && (
        <HandoverModal
          isOpen={Boolean(handoverTarget)}
          order={handoverTarget}
          onClose={() => setHandoverTarget(null)}
          onSuccess={() => {
            loadDeliveries();
            setHandoverTarget(null);
          }}
          onOpenPayment={(ordId) => {
            setHandoverTarget(null);
            if (onNavigateToPayment) onNavigateToPayment(ordId);
          }}
        />
      )}
    </div>
  );
}
