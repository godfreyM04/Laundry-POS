import React from 'react';
import { ORDER_STATUS_LABELS } from '../../lib/constants';
import { Clock, RefreshCw, CheckCircle, PackageCheck, Truck, Lock, XCircle, AlertCircle } from 'lucide-react';

export function StatusBadge({ status }) {
  const getIcon = () => {
    switch (status) {
      case 'received':
        return <Clock size={12} />;
      case 'processing':
        return <RefreshCw size={12} className="spin-slow" />;
      case 'ready':
      case 'awaiting_collection':
        return <PackageCheck size={12} />;
      case 'collected':
        return <CheckCircle size={12} />;
      case 'delivered':
        return <Truck size={12} />;
      case 'closed':
        return <Lock size={12} />;
      case 'cancelled':
        return <XCircle size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <span className={`status-pill ${status}`}>
      {getIcon()}
      {label}
    </span>
  );
}

export function PaymentBadge({ paymentStatus, balanceDue = 0 }) {
  if (paymentStatus === 'fully_paid' || balanceDue <= 0) {
    return (
      <span className="payment-pill fully_paid">
        <CheckCircle size={11} /> Fully Paid
      </span>
    );
  }
  if (paymentStatus === 'partially_paid') {
    return (
      <span className="payment-pill partially_paid">
        <Clock size={11} /> Partial Payment
      </span>
    );
  }
  return (
    <span className="payment-pill unpaid">
      <AlertCircle size={11} /> Unpaid
    </span>
  );
}
