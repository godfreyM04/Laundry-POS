import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { handoverOrder } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PackageCheck, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function HandoverModal({ isOpen, onClose, order, onSuccess, onOpenPayment }) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const isDelivery = order.fulfillment_type === 'delivery';
  const hasOutstandingBalance = Number(order.balance_due) > 0;

  const handleConfirmHandover = async () => {
    setErrorMsg('');

    if (hasOutstandingBalance) {
      setErrorMsg(`Cannot release order: Outstanding balance of ${formatCurrency(order.balance_due)} must be settled first.`);
      return;
    }

    setSubmitting(true);
    try {
      await handoverOrder({
        orderId: order.id,
        notes: notes.trim()
      });

      showToast({
        title: isDelivery ? 'Delivery Recorded' : 'Pickup Confirmed',
        message: `Order #${order.order_number} has been marked as ${isDelivery ? 'delivered' : 'collected'}.`,
        type: 'success'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete handover.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDelivery ? 'Confirm Delivery Handover' : 'Confirm Customer Pickup'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          {hasOutstandingBalance ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onOpenPayment) onOpenPayment(order.id);
              }}
            >
              Collect Outstanding Balance First
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleConfirmHandover}
              disabled={submitting}
            >
              {submitting ? 'Confirming...' : `Confirm ${isDelivery ? 'Delivery' : 'Customer Pickup'}`}
            </button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div className="alert-box alert-danger">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Order Details Card */}
        <div style={{
          padding: '14px 18px',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Order Reference:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '15px' }}>{order.order_number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Customer:</span>
            <strong>{order.customer_name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Amount:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Paid to Date:</span>
            <span style={{ color: '#047857', fontWeight: 600 }}>{formatCurrency(order.total_paid)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '6px',
            borderTop: '1px dashed var(--border-medium)',
            marginTop: '4px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Outstanding Balance:</span>
            <strong style={{ fontSize: '15px', color: hasOutstandingBalance ? '#b91c1c' : '#047857' }}>
              {formatCurrency(order.balance_due)}
            </strong>
          </div>
        </div>

        {/* Validation Check Notice */}
        {hasOutstandingBalance ? (
          <div className="alert-box alert-warning">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              <strong>Payment Verification Incomplete:</strong>
              <p style={{ marginTop: '2px' }}>
                Business policy strictly prohibits releasing laundry orders until the balance is cleared. Please record the remaining payment of <strong>{formatCurrency(order.balance_due)}</strong> before confirming handover.
              </p>
            </div>
          </div>
        ) : (
          <div className="alert-box alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              <strong>Payment Cleared:</strong> Order has been fully paid. Ready for customer handover.
            </div>
          </div>
        )}

        {isDelivery && (
          <div className="form-group">
            <label className="form-label">Delivery Location</label>
            <input
              type="text"
              value={order.delivery_address || 'Customer registered address'}
              disabled
              style={{ background: '#f1f5f9' }}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Handover Notes / Verification Remarks</label>
          <textarea
            rows={2}
            placeholder={isDelivery ? 'e.g., Delivered to recipient at gate, signed by David' : 'e.g., Customer inspected suit and evening dress, all clean.'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
