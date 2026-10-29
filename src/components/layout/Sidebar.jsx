import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../lib/constants';
import { 
  ShoppingCart, 
  Layers, 
  Users, 
  CreditCard, 
  Truck, 
  Settings, 
  BarChart3, 
  Tag, 
  ShieldCheck, 
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

export function Sidebar({ activeScreen, setActiveScreen, orderCounts = {} }) {
  const { role, currentUser, isAdmin, isCashier, isLaundryStaff, isDeliveryStaff } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="sidebar-brand-name">LaundryPOS</div>
          <span className="sidebar-brand-tag">Management & POS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {/* Core POS & Customer Section */}
        {isAdmin && (
          <button
            type="button"
            className={`sidebar-nav-item ${activeScreen === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveScreen('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Operations Overview</span>
          </button>
        )}

        {isCashier && (
          <div className="sidebar-section-title">Cashier Operations</div>
        )}

        {isCashier && (
          <button
            type="button"
            className={`sidebar-nav-item ${activeScreen === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveScreen('pos')}
          >
            <ShoppingCart size={18} />
            <span>POS / New Order</span>
          </button>
        )}

        <button
          type="button"
          className={`sidebar-nav-item ${activeScreen === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveScreen('orders')}
        >
          <Layers size={18} />
          <span>Orders & Handover</span>
          {orderCounts.ready > 0 && (
            <span className="badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 700 }}>
              {orderCounts.ready} ready
            </span>
          )}
        </button>

        {isCashier && (
          <button
            type="button"
            className={`sidebar-nav-item ${activeScreen === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveScreen('payments')}
          >
            <CreditCard size={18} />
            <span>Payments & Dues</span>
          </button>
        )}

        {isCashier && (
          <button
            type="button"
            className={`sidebar-nav-item ${activeScreen === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveScreen('customers')}
          >
            <Users size={18} />
            <span>Customer Directory</span>
          </button>
        )}

        {/* Processing Operations */}
        {(isLaundryStaff || isAdmin) && (
          <>
            <div className="sidebar-section-title">Processing & Care</div>
            <button
              type="button"
              className={`sidebar-nav-item ${activeScreen === 'processing' ? 'active' : ''}`}
              onClick={() => setActiveScreen('processing')}
            >
              <Layers size={18} />
              <span>Processing Queue</span>
              {orderCounts.processing > 0 && (
                <span className="badge">
                  {orderCounts.processing}
                </span>
              )}
            </button>
          </>
        )}

        {/* Deliveries */}
        {(isDeliveryStaff || isAdmin) && (
          <>
            <div className="sidebar-section-title">Fulfillment</div>
            <button
              type="button"
              className={`sidebar-nav-item ${activeScreen === 'deliveries' ? 'active' : ''}`}
              onClick={() => setActiveScreen('deliveries')}
            >
              <Truck size={18} />
              <span>Delivery Queue</span>
            </button>
          </>
        )}

        {/* Administration Section */}
        {isAdmin && (
          <>
            <div className="sidebar-section-title">Administration</div>
            <button
              type="button"
              className={`sidebar-nav-item ${activeScreen === 'services' ? 'active' : ''}`}
              onClick={() => setActiveScreen('services')}
            >
              <Tag size={18} />
              <span>Services & Pricing</span>
            </button>
            <button
              type="button"
              className={`sidebar-nav-item ${activeScreen === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveScreen('reports')}
            >
              <BarChart3 size={18} />
              <span>Financial Reports</span>
            </button>
            <button
              type="button"
              className={`sidebar-nav-item ${activeScreen === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveScreen('staff')}
            >
              <ShieldCheck size={18} />
              <span>Staff & Permissions</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-profile-compact">
          <div className="user-avatar">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="user-info-text">
            <div className="user-name">
              {currentUser?.full_name?.split(' ')[0] || 'Staff'}
            </div>
            <div className="user-role-badge">
              {currentUser?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
