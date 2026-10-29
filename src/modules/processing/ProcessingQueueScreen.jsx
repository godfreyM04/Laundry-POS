import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ORDER_STATUS } from '../../lib/constants';
import { 
  Play, 
  CheckCircle2, 
  Layers, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

export function ProcessingQueueScreen({ onSelectOrder }) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'processing' | 'ready'
  const [search, setSearch] = useState('');

  // Transition Modal
  const [transitionTarget, setTransitionTarget] = useState(null); // { order, targetStatus }
  const [reasonNotes, setReasonNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProcessingOrders();
  }, []);

  const loadProcessingOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load processing orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const receivedOrders = orders.filter(o => o.status === ORDER_STATUS.RECEIVED);
  const inProgressOrders = orders.filter(o => o.status === ORDER_STATUS.PROCESSING);
  const readyOrders = orders.filter(o => o.status === ORDER_STATUS.READY);

  const displayedOrders = (activeTab === 'received' 
    ? receivedOrders 
    : activeTab === 'processing' 
    ? inProgressOrders 
    : readyOrders
  ).filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
  });

  const handleExecuteTransition = async () => {
    if (!transitionTarget) return;

    setUpdating(true);
    try {
      await updateOrderStatus(
        transitionTarget.order.id,
        transitionTarget.targetStatus,
        reasonNotes.trim(),
        currentUser?.full_name || 'Laundry Staff'
      );

      showToast({
        title: transitionTarget.targetStatus === ORDER_STATUS.READY ? 'Order Ready for Handover!' : 'Processing Started',
        message: `Order #${transitionTarget.order.order_number} has been updated to ${transitionTarget.targetStatus}.`,
        type: 'success'
      });

      setTransitionTarget(null);
      setReasonNotes('');
      await loadProcessingOrders();
    } catch (err) {
      console.error('Status transition error:', err);
      showToast({
        title: 'Update Failed',
        message: err.message || 'Could not update status.',
        type: 'danger'
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner / Stat Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {/* Stage 1: Received */}
        <div
          onClick={() => setActiveTab('received')}
          style={{
            background: '#ffffff',
            border: activeTab === 'received' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>1. Received (Pending Wash)</span>
            <span style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {receivedOrders.length}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            {receivedOrders.length} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>orders waiting</span>
          </div>
        </div>

        {/* Stage 2: Processing */}
        <div
          onClick={() => setActiveTab('processing')}
          style={{
            background: '#ffffff',
            border: activeTab === 'processing' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>2. In Washing & Pressing</span>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {inProgressOrders.length}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            {inProgressOrders.length} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>in machines / iron</span>
          </div>
        </div>

        {/* Stage 3: Ready for Handover */}
        <div
          onClick={() => setActiveTab('ready')}
          style={{
            background: '#ffffff',
            border: activeTab === 'ready' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>3. Ready for Collection / Delivery</span>
            <span style={{
              background: '#fef3c7',
              color: '#b45309',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {readyOrders.length}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            {readyOrders.length} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>clean on racks</span>
          </div>
        </div>
      </div>

      {/* Search and Refresh Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div className="search-input-wrapper" style={{ width: '380px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search queue by order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadProcessingOrders}>
          <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Orders Grid / Queue Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading queue...
          </div>
        ) : displayedOrders.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px 24px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-muted)'
          }}>
            <Sparkles size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No orders currently in this stage</div>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Select another stage tab above or check back when cashiers register new drop-offs.
            </p>
          </div>
        ) : (
          displayedOrders.map((ord) => (
            <div
              key={ord.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'var(--primary-800)' }}>
                    {ord.order_number}
                  </span>
                  <StatusBadge status={ord.status} />
                </div>

                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '6px' }}>
                  {ord.customer_name}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Clock size={11} /> Dropped: {formatDateTime(ord.created_at)}
                </div>

                {/* Garment / care instructions */}
                {ord.notes && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    background: '#fffbeb',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fde68a',
                    fontSize: '12px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Care Note:</strong> {ord.notes}</span>
                  </div>
                )}
              </div>

              {/* Action buttons according to stage */}
              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    if (onSelectOrder) onSelectOrder(ord.id);
                  }}
                >
                  Inspect Order
                </button>

                {ord.status === ORDER_STATUS.RECEIVED && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setTransitionTarget({ order: ord, targetStatus: ORDER_STATUS.PROCESSING })}
                  >
                    <Play size={13} /> Start Processing
                  </button>
                )}

                {ord.status === ORDER_STATUS.PROCESSING && (
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => setTransitionTarget({ order: ord, targetStatus: ORDER_STATUS.READY })}
                  >
                    <CheckCircle2 size={13} /> Mark Order Ready
                  </button>
                )}

                {ord.status === ORDER_STATUS.READY && (
                  <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
                    Awaiting Front Desk Handover
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Transition Confirmation Modal */}
      {transitionTarget && (
        <Modal
          isOpen={Boolean(transitionTarget)}
          onClose={() => setTransitionTarget(null)}
          title={
            transitionTarget.targetStatus === ORDER_STATUS.READY
              ? 'Mark Order as Complete & Ready'
              : 'Move Order into Washing & Care'
          }
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTransitionTarget(null)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${transitionTarget.targetStatus === ORDER_STATUS.READY ? 'btn-success' : 'btn-primary'}`}
                onClick={handleExecuteTransition}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.4 }}>
              Are you sure you want to advance order <strong>{transitionTarget.order.order_number}</strong> ({transitionTarget.order.customer_name}) to{' '}
              <strong style={{ textTransform: 'uppercase' }}>{transitionTarget.targetStatus}</strong>?
            </p>

            {transitionTarget.targetStatus === ORDER_STATUS.READY && (
              <div className="alert-box alert-info" style={{ fontSize: '12.5px' }}>
                <CheckCircle2 size={16} />
                <span>
                  This will log completion timestamp and send an instant ready notification to the cashiers at the front desk.
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Processing Notes / Quality Inspection</label>
              <input
                type="text"
                placeholder="e.g., Stain successfully removed, double pressed, hanger 14"
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
