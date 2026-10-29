import React, { useState, useEffect } from 'react';
import { getOrders, getOperationalSummary } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Coins, 
  ArrowUpRight, 
  Layers, 
  PackageCheck, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';

export function OverviewScreen({ onNavigate, onSelectOrder }) {
  const { currentUser, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [ordList, sum] = await Promise.all([
        getOrders(),
        getOperationalSummary()
      ]);
      setOrders(ordList || []);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const recentOrders = orders.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Welcome & Fast Operations Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e, #115e59)',
        color: '#ffffff',
        padding: '24px 28px',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#99f6e4', fontWeight: 700 }}>
            Active Station Session
          </span>
          <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>
            Welcome, {currentUser?.full_name?.split(' ')[0] || 'Staff'}
          </h2>
          <p style={{ color: '#ccfbf1', fontSize: '13px', marginTop: '4px', maxWidth: '520px' }}>
            LaundryPOS is operational. Fast counter orders, processing workflows, and payment validations are active.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-lg"
            style={{ background: '#ffffff', color: '#0f766e', fontWeight: 700 }}
            onClick={() => onNavigate('pos')}
          >
            <ShoppingCart size={18} /> New POS Order
          </button>
          <button
            type="button"
            className="btn btn-lg"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
            onClick={() => onNavigate('payments')}
          >
            <CreditCard size={18} /> Record Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Verified Funds Received</div>
            <div className="stat-value" style={{ color: '#047857' }}>
              {formatCurrency(summary?.actualMoneyReceived || 0)}
            </div>
            <div className="stat-subtext">Confirmed payments received</div>
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
            <div className="stat-subtext">Unsettled receivables</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <PackageCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Ready for Handover</div>
            <div className="stat-value" style={{ color: '#b45309' }}>
              {summary?.readyOrdersCount || 0}
            </div>
            <div className="stat-subtext">Awaiting customer collection</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">In Washing & Care</div>
            <div className="stat-value" style={{ color: '#0369a1' }}>
              {summary?.processingCount || 0}
            </div>
            <div className="stat-subtext">Active processing orders</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Recent Laundry Orders</h4>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--primary-700)', fontWeight: 600 }}
            onClick={() => onNavigate('orders')}
          >
            View All Orders <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total Value</th>
                <th>Balance Due</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No recent orders. Click "New POS Order" to start.
                  </td>
                </tr>
              ) : (
                recentOrders.map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-800)' }}>
                      {ord.order_number}
                    </td>
                    <td style={{ fontWeight: 600 }}>{ord.customer_name}</td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                    <td>
                      <PaymentBadge paymentStatus={ord.payment_status_computed} balanceDue={ord.balance_due} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(ord.total_amount)}</td>
                    <td style={{ fontWeight: 700, color: ord.balance_due > 0 ? '#b91c1c' : '#047857' }}>
                      {formatCurrency(ord.balance_due)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDateTime(ord.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => onSelectOrder(ord.id)}
                      >
                        Inspect
                      </button>
                    </td>
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
