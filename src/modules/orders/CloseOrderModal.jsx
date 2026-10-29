import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { closeOrder } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function CloseOrderModal({ isOpen, onClose, order, onSuccess }) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [closureNotes, setClosureNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const handleCloseOrder = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await closeOrder({
        orderId: order.id,
        notes: closureNotes.trim(),
        closedByName: currentUser?.full_name || 'Cashier'
      });

      showToast({
        title: 'Order Finalized & Closed',
        message: `Order #${order.order_number} has been archived in permanent closed records.`,
        type: 'success'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to close order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalize & Close Order"
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#0f172a' }}
            onClick={handleCloseOrder}
            disabled={submitting}
          >
            {submitting ? 'Closing...' : 'Close & Finalize Order'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {errorMsg && (
          <div className="alert-box alert-danger">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{
          padding: '14px',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div>Order: <strong>{order.order_number}</strong></div>
          <div>Customer: <strong>{order.customer_name}</strong></div>
          <div>Current Status: <strong style={{ textTransform: 'capitalize' }}>{order.status}</strong></div>
          <div>Balance Due: <strong style={{ color: '#047857' }}>{formatCurrency(order.balance_due || 0)}</strong></div>
        </div>

        <div className="alert-box alert-info" style={{ fontSize: '12.5px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>
            Closing an order seals the financial and operational record. The order remains fully searchable in operational history and reports, but further modifications are locked.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Final Closure Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Satisfied regular customer, complete order"
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
