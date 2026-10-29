import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { getOrderById } from '../../lib/api';
import { formatCurrency, formatDateTime, formatPhone } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { ORDER_STATUS } from '../../lib/constants';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  PackageCheck, 
  Lock, 
  FileText, 
  History,
  Truck,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';

export function OrderDetailModal({ 
  orderId, 
  isOpen, 
  onClose, 
  onOpenPayment, 
  onOpenHandover, 
  onOpenCloseOrder,
  onShowReceipt 
}) {
  const { role, isCashier, isAdmin, isLaundryStaff, isDeliveryStaff } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'payments' | 'history'

  useEffect(() => {
    if (isOpen && orderId) {
      loadDetails();
    }
  }, [isOpen, orderId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? `Order Details: ${order.order_number}` : 'Order Details'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {order && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Balance Due:{' '}
                <strong style={{ color: order.balance_due > 0 ? '#b91c1c' : '#059669', fontSize: '13px' }}>
                  {formatCurrency(order.balance_due)}
                </strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>

            {/* Cashier Payment Action */}
            {isCashier && order && order.balance_due > 0 && order.status !== ORDER_STATUS.CLOSED && order.status !== ORDER_STATUS.CANCELLED && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  if (onOpenPayment) onOpenPayment(order.id);
                }}
              >
                <CreditCard size={15} /> Record Payment
              </button>
            )}

            {/* Handover Action (Pickup or Delivery) */}
            {order && (order.status === ORDER_STATUS.READY || order.status === ORDER_STATUS.AWAITING_COLLECTION) && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  onClose();
                  if (onOpenHandover) onOpenHandover(order);
                }}
              >
                <PackageCheck size={15} /> Confirm {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}
              </button>
            )}

            {/* Close Order Action */}
            {(isCashier || isAdmin) && order && (order.status === ORDER_STATUS.COLLECTED || order.status === ORDER_STATUS.DELIVERED) && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#334155' }}
                onClick={() => {
                  onClose();
                  if (onOpenCloseOrder) onOpenCloseOrder(order);
                }}
              >
                <Lock size={15} /> Close Order
              </button>
            )}
          </div>
        </div>
      }
    >
      {loading || !order ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading order details...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Status & Customer Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '16px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <StatusBadge status={order.status} />
                <PaymentBadge paymentStatus={order.payment_status_computed} balanceDue={order.balance_due} />
                {order.priority && order.priority !== 'standard' && (
                  <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {order.priority}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700 }}>
                <User size={16} color="var(--primary-700)" />
                {order.customer_name}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {formatPhone(order.customer_phone)}
                </span>
                {order.customer_email && <span>{order.customer_email}</span>}
              </div>
              {order.delivery_address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <MapPin size={12} /> {order.delivery_address}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Fulfillment: <strong>{order.fulfillment_type === 'delivery' ? 'Delivery Dispatch' : 'In-Store Pickup'}</strong>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Created: <strong>{formatDateTime(order.created_at)}</strong>
              </div>
              {order.ready_at && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ready At: <strong>{formatDateTime(order.ready_at)}</strong>
                </div>
              )}
              {order.collected_at && (
                <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                  Collected: <strong>{formatDateTime(order.collected_at)}</strong>
                </div>
              )}
              {order.delivered_at && (
                <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                  Delivered: <strong>{formatDateTime(order.delivered_at)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Notes alert if any */}
          {order.notes && (
            <div className="alert-box alert-info" style={{ padding: '8px 12px', fontSize: '12.5px' }}>
              <FileText size={15} />
              <span><strong>Instructions:</strong> {order.notes}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
            <button
              type="button"
              className={`category-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              Order Items ({order.items?.length || 0})
            </button>
            <button
              type="button"
              className={`category-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              Payments ({order.payments?.length || 0})
            </button>
            <button
              type="button"
              className={`category-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Audit History ({order.history?.length || 0})
            </button>
          </div>

          {/* TAB 1: Line Items */}
          {activeTab === 'items' && (
            <div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Item Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.service_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.item_description || '—'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                gap: '24px'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order Total: </span>
                  <strong style={{ fontSize: '15px' }}>{formatCurrency(order.total_amount)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paid: </span>
                  <strong style={{ fontSize: '15px', color: '#047857' }}>{formatCurrency(order.total_paid)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Balance: </span>
                  <strong style={{ fontSize: '15px', color: order.balance_due > 0 ? '#b91c1c' : '#047857' }}>
                    {formatCurrency(order.balance_due)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Payments */}
          {activeTab === 'payments' && (
            <div>
              {(!order.payments || order.payments.length === 0) ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payment recorded yet for this order.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Reference</th>
                        <th>Recorded By</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.payments.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.receipt_number}</td>
                          <td style={{ fontWeight: 700, color: '#047857' }}>{formatCurrency(p.amount)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.payment_method?.replace('_', ' ')}</td>
                          <td>
                            <span className="payment-pill fully_paid">{p.payment_status}</span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.transaction_reference || '—'}</td>
                          <td>{p.recorded_by_name || 'Staff'}</td>
                          <td style={{ fontSize: '12px' }}>{formatDateTime(p.created_at)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                if (onShowReceipt) onShowReceipt(p, order);
                              }}
                            >
                              <Printer size={13} /> Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: History */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!order.history || order.history.length === 0) ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit history records available.
                </div>
              ) : (
                order.history.map((h, i) => (
                  <div
                    key={h.id || i}
                    style={{
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                          {h.new_status}
                        </span>
                        {h.previous_status && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            (from {h.previous_status})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {h.reason || 'Status updated'} • Changed by: <strong>{h.changed_by_name || 'Staff'}</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                      {formatDateTime(h.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
