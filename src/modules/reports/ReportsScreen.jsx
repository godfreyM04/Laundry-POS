import React, { useState, useEffect } from 'react';
import { getOrders, getPayments, getOperationalSummary } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  BarChart3, 
  Coins, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileSpreadsheet,
  Download
} from 'lucide-react';

export function ReportsScreen() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [ords, pays, sum] = await Promise.all([
        getOrders(),
        getPayments(),
        getOperationalSummary()
      ]);
      setOrders(ords || []);
      setPayments(pays || []);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status breakdown counts
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Payment methods breakdown
  const paymentMethodTotals = payments.reduce((acc, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  // Outstanding debtors list
  const outstandingOrders = orders.filter(o => Number(o.balance_due) > 0 && o.status !== 'cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--primary-600)" />
            Financial & Operational Reports
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Audited financial revenue, payment method distribution, and order status throughput.
          </p>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Actual Money Received</div>
            <div className="stat-value" style={{ color: '#047857' }}>
              {formatCurrency(summary?.actualMoneyReceived || 0)}
            </div>
            <div className="stat-subtext">Verified funds in bank/till</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdfa', color: 'var(--primary-700)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Invoiced Order Value</div>
            <div className="stat-value">{formatCurrency(summary?.totalOrderValue || 0)}</div>
            <div className="stat-subtext">Cumulative booked value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Outstanding Balances</div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>
              {formatCurrency(summary?.totalOutstandingBalance || 0)}
            </div>
            <div className="stat-subtext">Due from {outstandingOrders.length} orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Handled Orders</div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-subtext">{summary?.activeOrdersCount || 0} active, {summary?.closedOrdersCount || 0} closed</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Status Breakdown + Payment Method Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Status Pipeline */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Order Lifecycle Pipeline</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{orders.length} Total Orders</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'received', label: '1. Received (Pending Processing)', color: '#64748b', bg: '#f1f5f9' },
                { key: 'processing', label: '2. In Washing & Steam Ironing', color: '#0369a1', bg: '#e0f2fe' },
                { key: 'ready', label: '3. Ready for Collection / Delivery', color: '#b45309', bg: '#fef3c7' },
                { key: 'collected', label: '4. Collected by Customer', color: '#15803d', bg: '#dcfce7' },
                { key: 'delivered', label: '5. Dispatched & Delivered', color: '#047857', bg: '#d1fae5' },
                { key: 'closed', label: '6. Finalized & Closed', color: '#374151', bg: '#e5e7eb' }
              ].map(stage => {
                const count = statusCounts[stage.key] || 0;
                const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: stage.color }}>{stage.label}</span>
                      <strong>{count} orders ({pct}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: stage.color, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Revenue by Payment Channel</h4>
            <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
              {formatCurrency(summary?.actualMoneyReceived || 0)} Total
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'cash', label: 'Cash at Counter', color: '#10b981' },
                { key: 'mobile_money', label: 'Mobile Money (M-Pesa)', color: '#059669' },
                { key: 'card', label: 'Credit / Debit Card', color: '#0284c7' },
                { key: 'bank_transfer', label: 'Direct Bank Transfer', color: '#6366f1' }
              ].map(m => {
                const amt = paymentMethodTotals[m.key] || 0;
                const totalRev = summary?.actualMoneyReceived || 1;
                const pct = Math.round((amt / totalRev) * 100);
                return (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{m.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct}% of verified receipts</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{formatCurrency(amt)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Receivables Table */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Outstanding Customer Balances</h4>
          <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
            {formatCurrency(summary?.totalOutstandingBalance || 0)} Total Due
          </span>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Order Total</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {outstandingOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#047857' }}>
                    <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    All active orders have been paid in full! No outstanding dues.
                  </td>
                </tr>
              ) : (
                outstandingOrders.map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ord.order_number}</td>
                    <td style={{ fontWeight: 600 }}>{ord.customer_name}</td>
                    <td style={{ fontSize: '12px' }}>{ord.customer_phone}</td>
                    <td>{formatCurrency(ord.total_amount)}</td>
                    <td style={{ color: '#047857' }}>{formatCurrency(ord.total_paid)}</td>
                    <td style={{ color: '#b91c1c', fontWeight: 700 }}>{formatCurrency(ord.balance_due)}</td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDateTime(ord.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
