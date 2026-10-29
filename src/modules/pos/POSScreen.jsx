import React, { useState, useEffect } from 'react';
import { getServices, createOrder } from '../../lib/api';
import { formatCurrency, formatPhone } from '../../lib/formatters';
import { CustomerSelectModal } from './CustomerSelectModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Search, 
  User, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Truck,
  Building,
  Clock,
  Printer,
  ArrowRight
} from 'lucide-react';

export function POSScreen({ onOrderCreated, onNavigateToPayment }) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  // Catalogue & Cart State
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchService, setSearchService] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);

  // Selected Customer
  const [customer, setCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Cart & Line Items
  // item: { service_id, service_name, unit_price, quantity, item_description, line_total }
  const [cart, setCart] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [priority, setPriority] = useState('standard');
  const [orderNotes, setOrderNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const data = await getServices(true);
      setServices(data || []);
      const cats = ['All', ...new Set(data.map(s => s.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  // Add service to cart
  const handleAddToCart = (service) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.service_id === service.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          line_total: Math.round(newQty * service.price * 100) / 100
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            service_id: service.id,
            service_name: service.name,
            unit_price: Number(service.price),
            quantity: 1,
            unit: service.unit,
            item_description: '',
            line_total: Number(service.price)
          }
        ];
      }
    });
  };

  // Update quantity
  const handleUpdateQuantity = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const item = updated[idx];
      const newQty = Math.max(1, item.quantity + delta);
      updated[idx] = {
        ...item,
        quantity: newQty,
        line_total: Math.round(newQty * item.unit_price * 100) / 100
      };
      return updated;
    });
  };

  const handleCustomQuantity = (idx, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return;
    setCart(prev => {
      const updated = [...prev];
      const item = updated[idx];
      updated[idx] = {
        ...item,
        quantity: num,
        line_total: Math.round(num * item.unit_price * 100) / 100
      };
      return updated;
    });
  };

  const handleItemDescriptionChange = (idx, desc) => {
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], item_description: desc };
      return updated;
    });
  };

  const handleRemoveFromCart = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    setCart([]);
    setErrorMsg('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const totalAmount = subtotal;

  // Filtered Services
  const filteredServices = services.filter(s => {
    const matchesCat = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch = !searchService || s.name.toLowerCase().includes(searchService.toLowerCase()) || (s.description && s.description.toLowerCase().includes(searchService.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Submit Order Atomically
  const handleConfirmOrder = async () => {
    setErrorMsg('');

    if (!customer) {
      setErrorMsg('Please select or register a customer for this order.');
      setIsCustomerModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Please add at least one laundry service to the order.');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim() && !customer.address) {
      setErrorMsg('Please specify a delivery address for delivery orders.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        customerId: customer.id,
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? (deliveryAddress || customer.address) : null,
        priority,
        notes: orderNotes.trim() || null,
        creatorName: currentUser?.full_name || 'Cashier',
        items: cart.map(item => ({
          service_id: item.service_id,
          service_name: item.service_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_description: item.item_description
        }))
      });

      showToast({
        title: 'Order Created Successfully',
        message: `Order #${result.order_number} has been recorded.`,
        type: 'success'
      });

      setLastCreatedOrder({
        order_id: result.order_id,
        order_number: result.order_number,
        total_amount: result.total_amount,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        item_count: cart.length
      });

      // Reset cart and customer for next order
      setCart([]);
      setCustomer(null);
      setOrderNotes('');
      setDeliveryAddress('');

      if (onOrderCreated) {
        onOrderCreated(result);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMsg(err.message || 'Failed to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pos-grid-layout">
      {/* LEFT: Service Catalogue Grid */}
      <div className="pos-left-panel">
        {/* Customer Select / Quick Bar */}
        <div className="pos-customer-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: customer ? 'var(--primary-100)' : '#f1f5f9',
              color: customer ? 'var(--primary-700)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              {customer ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-main)' }}>
                    {customer.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatPhone(customer.phone)} {customer.address ? `• ${customer.address}` : ''}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                    No Customer Selected
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Attach customer details to generate receipt and tracking
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className={`btn ${customer ? 'btn-secondary btn-sm' : 'btn-primary'}`}
            onClick={() => setIsCustomerModalOpen(true)}
          >
            {customer ? 'Change Customer' : 'Select Customer'}
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search services by name or description (e.g., Suit, Duvet, Wash)..."
              value={searchService}
              onChange={(e) => setSearchService(e.target.value)}
            />
          </div>

          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="pos-services-grid">
          {loadingServices ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading services catalogue...
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No services found matching current filter.
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="service-tile"
                onClick={() => handleAddToCart(service)}
              >
                <div>
                  <span className="service-tile-category">{service.category}</span>
                  <div className="service-tile-name">{service.name}</div>
                  {service.description && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                      {service.description}
                    </div>
                  )}
                </div>
                <div className="service-tile-footer">
                  <div>
                    <span className="service-tile-price">{formatCurrency(service.price)}</span>
                    <span className="service-tile-unit"> / {service.unit}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '4px 8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(service);
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Order Cart & Summary Panel */}
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--primary-700)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Order Cart ({cart.length})</h3>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: '#ef4444' }}
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="pos-cart-items">
          {errorMsg && (
            <div className="alert-box alert-danger" style={{ marginBottom: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: '24px',
              textAlign: 'center'
            }}>
              <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Cart is Empty</div>
              <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '240px' }}>
                Select items from the service catalogue on the left to add them to this order.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.service_id + idx} className="cart-item-card">
                <div className="cart-item-row">
                  <div>
                    <div className="cart-item-title">{item.service_name}</div>
                    <div className="cart-item-price-snapshot">
                      {formatCurrency(item.unit_price)} per {item.unit || 'unit'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-only btn-ghost"
                    style={{ color: '#94a3b8' }}
                    onClick={() => handleRemoveFromCart(idx)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Description note for garment/item specifics */}
                <input
                  type="text"
                  placeholder="Item details (e.g. Navy blue, stained collar, silk)..."
                  value={item.item_description}
                  onChange={(e) => handleItemDescriptionChange(idx, e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                />

                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(idx, -1)}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      className="qty-input"
                      value={item.quantity}
                      onChange={(e) => handleCustomQuantity(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(idx, 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="cart-item-total">
                    {formatCurrency(item.line_total)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fulfillment & Details Options */}
        {cart.length > 0 && (
          <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Fulfillment</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', marginTop: '2px' }}
                >
                  <option value="pickup">In-Store Pickup</option>
                  <option value="delivery">Delivery Dispatch</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', marginTop: '2px' }}
                >
                  <option value="standard">Standard Turnaround</option>
                  <option value="express">Express (24h)</option>
                  <option value="urgent">Urgent Same-Day</option>
                </select>
              </div>
            </div>

            {fulfillmentType === 'delivery' && (
              <input
                type="text"
                placeholder="Delivery Address / Drop-off location..."
                value={deliveryAddress || customer?.address || ''}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 8px' }}
              />
            )}

            <input
              type="text"
              placeholder="Order instructions (special wash, folding notes)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
          </div>
        )}

        {/* Total & Submit Action */}
        <div className="pos-cart-footer">
          <div className="cart-summary-line">
            <span>Subtotal ({cart.length} items):</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="cart-summary-total">
            <span>Total Payable:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={submitting || cart.length === 0}
            onClick={handleConfirmOrder}
          >
            {submitting ? 'Confirming Order...' : `Confirm & Save Order (${formatCurrency(totalAmount)})`}
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(selected) => setCustomer(selected)}
      />

      {/* Order Created Success Modal */}
      {lastCreatedOrder && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-sm" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
              Order Created!
            </h3>
            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--primary-700)',
              margin: '8px 0'
            }}>
              {lastCreatedOrder.order_number}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Customer: <strong>{lastCreatedOrder.customer_name}</strong><br />
              Total Amount: <strong>{formatCurrency(lastCreatedOrder.total_amount)}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const ordId = lastCreatedOrder.order_id;
                  setLastCreatedOrder(null);
                  if (onNavigateToPayment) onNavigateToPayment(ordId);
                }}
              >
                Record Payment Now <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLastCreatedOrder(null)}
              >
                Start Another Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
