import React from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { PAYMENT_METHOD_LABELS } from '../../lib/constants';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, receiptData, orderData }) {
  if (!receiptData) return null;

  const businessName = import.meta.env.VITE_BUSINESS_NAME || 'LaundryPOS Elite Cleaners';
  const businessPhone = import.meta.env.VITE_BUSINESS_PHONE || '+254 712 000 000';
  const businessLocation = import.meta.env.VITE_BUSINESS_LOCATION || 'Kilimani Plaza, Nairobi, Kenya';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Cryptographically logged transaction
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>
      }
    >
      <div className="receipt-container" id="printable-receipt">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-store-title">{businessName}</div>
          <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>{businessLocation}</div>
          <div style={{ fontSize: '11px', color: '#4b5563' }}>Tel: {businessPhone}</div>
          <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            *** PAYMENT RECEIPT ***
          </div>
        </div>

        {/* Metadata */}
        <div className="receipt-row">
          <span>Receipt No:</span>
          <strong>{receiptData.receipt_number}</strong>
        </div>
        <div className="receipt-row">
          <span>Order Ref:</span>
          <strong>{receiptData.order_number || orderData?.order_number}</strong>
        </div>
        <div className="receipt-row">
          <span>Date / Time:</span>
          <span>{formatDateTime(receiptData.created_at || new Date().toISOString())}</span>
        </div>
        <div className="receipt-row">
          <span>Cashier:</span>
          <span>{receiptData.recorded_by_name || 'Staff'}</span>
        </div>

        <div className="receipt-divider" />

        {/* Customer Info */}
        <div className="receipt-row">
          <span>Customer:</span>
          <strong>{receiptData.customer_name || orderData?.customer_name}</strong>
        </div>
        {orderData?.customer_phone && (
          <div className="receipt-row">
            <span>Phone:</span>
            <span>{orderData.customer_phone}</span>
          </div>
        )}

        {/* If line items available */}
        {orderData?.items && orderData.items.length > 0 && (
          <>
            <div className="receipt-divider" />
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>ORDER SERVICES:</div>
            {orderData.items.map((item, idx) => (
              <div key={idx} className="receipt-row" style={{ fontSize: '11px' }}>
                <span>{item.quantity}x {item.service_name}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </>
        )}

        <div className="receipt-divider" />

        {/* Financials */}
        {orderData?.total_amount && (
          <div className="receipt-row">
            <span>Total Order Value:</span>
            <span>{formatCurrency(orderData.total_amount)}</span>
          </div>
        )}
        <div className="receipt-row" style={{ fontSize: '13px', fontWeight: 'bold', color: '#047857' }}>
          <span>AMOUNT RECEIVED:</span>
          <span>{formatCurrency(receiptData.amount || receiptData.amount_paid)}</span>
        </div>
        <div className="receipt-row">
          <span>Payment Method:</span>
          <span>{PAYMENT_METHOD_LABELS[receiptData.payment_method] || receiptData.payment_method}</span>
        </div>
        {receiptData.transaction_reference && (
          <div className="receipt-row">
            <span>Transaction Ref:</span>
            <span>{receiptData.transaction_reference}</span>
          </div>
        )}

        <div className="receipt-divider" />

        {/* Remaining Balance */}
        <div className="receipt-row" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>
          <span>REMAINING BALANCE:</span>
          <span style={{ color: (receiptData.remaining_balance ?? orderData?.balance_due) > 0 ? '#b91c1c' : '#047857' }}>
            {formatCurrency(receiptData.remaining_balance ?? orderData?.balance_due ?? 0)}
          </span>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '10px', borderTop: '1px dashed #94a3b8', fontSize: '10.5px', color: '#6b7280' }}>
          <p>Thank you for choosing {businessName}!</p>
          <p style={{ marginTop: '2px' }}>Please present this receipt upon laundry collection.</p>
          <p style={{ marginTop: '4px', fontStyle: 'italic' }}>Items left uncollected after 30 days are subject to storage terms.</p>
        </div>
      </div>
    </Modal>
  );
}
