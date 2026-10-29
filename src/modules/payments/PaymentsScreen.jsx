import React, { useState, useEffect } from 'react';
import { getPayments, getOperationalSummary } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { PAYMENT_METHOD_LABELS } from '../../lib/constants';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Search, 
  Printer, 
  Plus, 
  ArrowUpRight, 
  Coins, 
  Receipt, 
  ShieldCheck,
  RefreshCw 
} from 'lucide-react';

export function PaymentsScreen() {
  const { isCashier } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payList, sum] = await Promise.all([
        getPayments(),
        getOperationalSummary()
      ]);
      setPayments(payList || []);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    if (!matchesMethod) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.receipt_number && p.receipt_number.toLowerCase().includes(q)) ||
      (p.order_number && p.order_number.toLowerCase().includes(q)) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Financial Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Verified Funds Received</div>
            <div className="stat-value">{formatCurrency(summary?.actualMoneyReceived || 0)}</div>
            <div className="stat-subtext">Across {payments.length} successful transactions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Outstanding Unpaid Dues</div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>
              {formatCurrency(summary?.totalOutstandingBalance || 0)}
            </div>
            <div className="stat-subtext">Receivables pending customer clearance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdfa', color: 'var(--primary-700)' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Order Value Booked</div>
            <div className="stat-value">{formatCurrency(summary?.totalOrderValue || 0)}</div>
            <div className="stat-subtext">Gross invoiced service totals</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
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
              placeholder="Search receipt #, order ref, customer, or transaction code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="mobile_money">Mobile Money (M-Pesa)</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> Refresh
          </button>
          {isCashier && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsRecordModalOpen(true)}
            >
              <Plus size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt Ref</th>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Amount Received</th>
              <th>Payment Method</th>
              <th>Transaction Code</th>
              <th>Cashier</th>
              <th>Verified At</th>
              <th style={{ textAlign: 'right' }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading payment logs...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No payment records found matching current query.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-800)' }}>
                    {p.receipt_number}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {p.order_number || '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {p.customer_name || 'Customer'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#047857' }}>
                    {formatCurrency(p.amount)}
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      background: '#f1f5f9',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}>
                      {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {p.transaction_reference || '—'}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {p.recorded_by_name || 'Cashier'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTime(p.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedReceipt(p)}
                      title="View & Print Official Receipt"
                    >
                      <Printer size={13} /> Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onPaymentSuccess={(result, ord) => {
          loadData();
          if (result.payment) {
            setSelectedReceipt({
              ...result.payment,
              order_number: ord?.order_number,
              customer_name: ord?.customer_name
            });
          }
        }}
      />

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          receiptData={selectedReceipt}
          orderData={{
            order_number: selectedReceipt.order_number,
            customer_name: selectedReceipt.customer_name
          }}
        />
      )}
    </div>
  );
}
