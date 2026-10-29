import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { getOrders, recordPayment } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { CreditCard, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export function RecordPaymentModal({ 
  isOpen, 
  onClose, 
  preselectedOrderId = null, 
  onPaymentSuccess 
}) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEligibleOrders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedOrderId) {
      setSelectedOrderId(preselectedOrderId);
    }
  }, [preselectedOrderId]);

  useEffect(() => {
    if (selectedOrderId && orders.length > 0) {
      const ord = orders.find(o => o.id === selectedOrderId);
      setSelectedOrder(ord || null);
      if (ord) {
        // Autofill amount with remaining balance
        setAmount(ord.balance_due.toString());
      }
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId, orders]);

  const loadEligibleOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await getOrders();
      // Only include non-cancelled, non-closed orders with balance_due > 0 (or preselected order)
      const eligible = data.filter(o => 
        (o.balance_due > 0 && o.status !== 'closed' && o.status !== 'cancelled') || 
        o.id === preselectedOrderId
      );
      setOrders(eligible);
    } catch (err) {
      console.error('Failed to load eligible orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedOrderId || !selectedOrder) {
      setErrorMsg('Please select an order to apply payment to.');
      return;
    }

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if (payNum > Number(selectedOrder.balance_due)) {
      setErrorMsg(`Payment amount (${formatCurrency(payNum)}) exceeds the outstanding balance of ${formatCurrency(selectedOrder.balance_due)}.`);
      return;
    }

    // Require transaction reference if mobile money or card or bank
    if (paymentMethod !== PAYMENT_METHODS.CASH && !transactionRef.trim()) {
      setErrorMsg(`Please enter a transaction reference / approval code for ${PAYMENT_METHOD_LABELS[paymentMethod]}.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordPayment({
        orderId: selectedOrderId,
        amount: payNum,
        paymentMethod,
        transactionReference: transactionRef.trim() || null,
        notes: notes.trim() || null,
        recordedByName: currentUser?.full_name || 'Cashier'
      });

      showToast({
        title: 'Payment Recorded & Verified',
        message: `Receipt #${result.receipt_number} issued for ${formatCurrency(payNum)}.`,
        type: 'success'
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(result, selectedOrder);
      }
      onClose();
    } catch (err) {
      console.error('Payment recording error:', err);
      setErrorMsg(err.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record & Verify Customer Payment"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRecordPayment}
            disabled={submitting || !selectedOrder}
          >
            {submitting ? 'Recording & Verifying...' : `Confirm & Issue Receipt (${formatCurrency(amount || 0)})`}
          </button>
        </>
      }
    >
      <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {errorMsg && (
          <div className="alert-box alert-danger">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Select Order */}
        <div className="form-group">
          <label className="form-label">Select Order with Outstanding Balance *</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            disabled={loadingOrders || Boolean(preselectedOrderId)}
            required
          >
            <option value="">-- Choose Order --</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.order_number} - {o.customer_name} (Due: {formatCurrency(o.balance_due)})
              </option>
            ))}
          </select>
        </div>

        {/* Order Balance Snapshot Card */}
        {selectedOrder && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            fontSize: '12.5px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Order Total</span>
              <strong style={{ fontSize: '14px' }}>{formatCurrency(selectedOrder.total_amount)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Previously Paid</span>
              <strong style={{ fontSize: '14px', color: '#047857' }}>{formatCurrency(selectedOrder.total_paid)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Current Balance Due</span>
              <strong style={{ fontSize: '14px', color: '#b91c1c' }}>{formatCurrency(selectedOrder.balance_due)}</strong>
            </div>
          </div>
        )}

        {/* Payment Amount & Method */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount Received (KES) *</label>
            <input
              type="number"
              step="any"
              min="1"
              max={selectedOrder ? selectedOrder.balance_due : undefined}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value={PAYMENT_METHODS.CASH}>{PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CASH]}</option>
              <option value={PAYMENT_METHODS.MOBILE_MONEY}>{PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MOBILE_MONEY]}</option>
              <option value={PAYMENT_METHODS.CARD}>{PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CARD]}</option>
              <option value={PAYMENT_METHODS.BANK_TRANSFER}>{PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BANK_TRANSFER]}</option>
            </select>
          </div>
        </div>

        {/* Transaction Reference */}
        <div className="form-group">
          <label className="form-label">
            Transaction Reference {paymentMethod !== PAYMENT_METHODS.CASH ? '*' : '(Optional)'}
            <span className="form-helper">
              {paymentMethod === PAYMENT_METHODS.MOBILE_MONEY ? 'M-Pesa confirmation code' : 'Card auth / Bank slip #'}
            </span>
          </label>
          <input
            type="text"
            placeholder={paymentMethod === PAYMENT_METHODS.MOBILE_MONEY ? 'e.g. QGK72910KP' : 'e.g. AUTH-98213'}
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            required={paymentMethod !== PAYMENT_METHODS.CASH}
          />
        </div>

        {/* Payment Notes */}
        <div className="form-group">
          <label className="form-label">Payment Remarks / Memo</label>
          <input
            type="text"
            placeholder="e.g. Initial deposit at drop-off / Full clearance"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
