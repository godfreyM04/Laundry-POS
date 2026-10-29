import React, { useState, useEffect } from 'react';
import { getOrders } from '../../lib/api';
import { formatCurrency, formatDateTime, formatPhone } from '../../lib/formatters';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { OrderDetailModal } from './OrderDetailModal';
import { HandoverModal } from './HandoverModal';
import { CloseOrderModal } from './CloseOrderModal';
import { ORDER_STATUS } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Layers, 
  Filter, 
  Eye, 
  CreditCard, 
  PackageCheck, 
  Lock, 
  Truck, 
  Building, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

export function OrdersListScreen({ onNavigateToPOS, onNavigateToPayment, onShowReceipt, selectedOrderIdInit }) {
  const { role, isCashier, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedOrderId, setSelectedOrderId] = useState(selectedOrderIdInit || null);
  const [handoverOrderTarget, setHandoverOrderTarget] = useState(null);
  const [closeOrderTarget, setCloseOrderTarget] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  useEffect(() => {
    if (selectedOrderIdInit) {
      setSelectedOrderId(selectedOrderIdInit);
    }
  }, [selectedOrderIdInit]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders({
        status: statusFilter,
        search
      });
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusTabs = [
    { key: 'all', label: 'All Orders' },
    { key: ORDER_STATUS.RECEIVED, label: 'Received' },
    { key: ORDER_STATUS.PROCESSING, label: 'Processing' },
    { key: ORDER_STATUS.READY, label: 'Ready for Handover' },
    { key: ORDER_STATUS.COLLECTED, label: 'Collected' },
    { key: ORDER_STATUS.DELIVERED, label: 'Delivered' },
    { key: ORDER_STATUS.CLOSED, label: 'Closed' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter and Search Bar */}
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
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '520px' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Order # (e.g. LP-2610-1001), customer, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadOrders}>
            <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> Refresh
          </button>
          {isCashier && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onNavigateToPOS}>
              + Create New Order
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="category-tabs">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`category-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Total Value</th>
              <th>Paid</th>
              <th>Balance Due</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No orders found matching the selected filter.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-800)' }}>
                      {ord.order_number}
                    </span>
                    {ord.priority && ord.priority !== 'standard' && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {ord.priority}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{formatPhone(ord.customer_phone)}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {ord.fulfillment_type === 'delivery' ? (
                        <><Truck size={12} color="#0284c7" /> Delivery</>
                      ) : (
                        <><Building size={12} color="#64748b" /> Pickup</>
                      )}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={ord.status} />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(ord.total_amount)}
                  </td>
                  <td style={{ color: '#047857', fontWeight: 600 }}>
                    {formatCurrency(ord.total_paid)}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: Number(ord.balance_due) > 0 ? '#b91c1c' : '#047857'
                    }}>
                      {formatCurrency(ord.balance_due)}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTime(ord.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedOrderId(ord.id)}
                        title="View Full Details"
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* Quick Record Payment */}
                      {isCashier && Number(ord.balance_due) > 0 && ord.status !== ORDER_STATUS.CLOSED && ord.status !== ORDER_STATUS.CANCELLED && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            if (onNavigateToPayment) onNavigateToPayment(ord.id);
                          }}
                          title="Record Payment"
                        >
                          <CreditCard size={13} /> Pay
                        </button>
                      )}

                      {/* Quick Handover button if ready */}
                      {(ord.status === ORDER_STATUS.READY || ord.status === ORDER_STATUS.AWAITING_COLLECTION) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => setHandoverOrderTarget(ord)}
                          title="Confirm Customer Handover"
                        >
                          <PackageCheck size={13} /> Handover
                        </button>
                      )}

                      {/* Quick Close button if collected/delivered */}
                      {(isCashier || isAdmin) && (ord.status === ORDER_STATUS.COLLECTED || ord.status === ORDER_STATUS.DELIVERED) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ borderColor: '#64748b' }}
                          onClick={() => setCloseOrderTarget(ord)}
                          title="Finalize & Close Order"
                        >
                          <Lock size={13} /> Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          onOpenPayment={(ordId) => {
            setSelectedOrderId(null);
            if (onNavigateToPayment) onNavigateToPayment(ordId);
          }}
          onOpenHandover={(ord) => {
            setSelectedOrderId(null);
            setHandoverOrderTarget(ord);
          }}
          onOpenCloseOrder={(ord) => {
            setSelectedOrderId(null);
            setCloseOrderTarget(ord);
          }}
          onShowReceipt={onShowReceipt}
        />
      )}

      {/* Handover Modal */}
      {handoverOrderTarget && (
        <HandoverModal
          isOpen={Boolean(handoverOrderTarget)}
          order={handoverOrderTarget}
          onClose={() => setHandoverOrderTarget(null)}
          onSuccess={() => {
            loadOrders();
            setHandoverOrderTarget(null);
          }}
          onOpenPayment={(ordId) => {
            setHandoverOrderTarget(null);
            if (onNavigateToPayment) onNavigateToPayment(ordId);
          }}
        />
      )}

      {/* Close Order Modal */}
      {closeOrderTarget && (
        <CloseOrderModal
          isOpen={Boolean(closeOrderTarget)}
          order={closeOrderTarget}
          onClose={() => setCloseOrderTarget(null)}
          onSuccess={() => {
            loadOrders();
            setCloseOrderTarget(null);
          }}
        />
      )}
    </div>
  );
}
