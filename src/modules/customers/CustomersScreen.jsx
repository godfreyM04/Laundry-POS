import React, { useState, useEffect } from 'react';
import { getCustomers, getOrders, createCustomer, updateCustomer } from '../../lib/api';
import { formatCurrency, formatDateTime, formatPhone, isValidPhone } from '../../lib/formatters';
import { Modal } from '../../components/common/Modal';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Mail, 
  ShoppingBag, 
  AlertCircle,
  FileText,
  Clock,
  Layers
} from 'lucide-react';

export function CustomersScreen({ onSelectOrder }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected customer for history drawer / modal
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', address: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custs, ords] = await Promise.all([
        getCustomers(),
        getOrders()
      ]);
      setCustomers(custs || []);
      setOrders(ords || []);
    } catch (err) {
      console.error('Failed to load customer directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ full_name: '', phone: '', email: '', address: '', notes: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      full_name: cust.full_name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      notes: cust.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name.trim()) {
      setFormError('Customer name is required');
      return;
    }

    if (!isValidPhone(formData.phone)) {
      setFormError('Please enter a valid phone number (e.g. +254712345678 or 0712345678)');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null
        });
      } else {
        await createCustomer({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const getCustomerStats = (customerId) => {
    const custOrders = orders.filter(o => o.customer_id === customerId);
    const orderCount = custOrders.length;
    const totalSpent = custOrders.reduce((sum, o) => sum + Number(o.total_paid || 0), 0);
    const totalDue = custOrders.reduce((sum, o) => sum + Number(o.balance_due || 0), 0);
    return { orderCount, totalSpent, totalDue, custOrders };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Bar */}
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
        <div className="search-input-wrapper" style={{ width: '420px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search customers by name, phone (+254...), email, or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <UserPlus size={15} /> Add Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Residence / Address</th>
              <th style={{ textAlign: 'center' }}>Total Orders</th>
              <th style={{ textAlign: 'right' }}>Lifetime Paid</th>
              <th style={{ textAlign: 'right' }}>Outstanding Due</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading customer records...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No customer matching query.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => {
                const { orderCount, totalSpent, totalDue } = getCustomerStats(cust.id);
                return (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cust.full_name}</div>
                      {cust.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cust.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color="var(--text-muted)" /> {formatPhone(cust.phone)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {cust.email || '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {cust.address || '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {orderCount}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                      {formatCurrency(totalSpent)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: totalDue > 0 ? '#b91c1c' : '#047857' }}>
                      {formatCurrency(totalDue)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setActiveCustomer(cust)}
                        >
                          <ShoppingBag size={13} /> History
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleOpenEdit(cust)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Information' : 'Register New Customer'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveCustomer} disabled={saving}>
              {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer}>
          {formError && (
            <div className="alert-box alert-danger" style={{ marginBottom: '14px' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Customer Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Grace Wanjiku"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                placeholder="e.g. +254712345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="grace@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address / Residence</label>
            <input
              type="text"
              placeholder="Apartment / Estate, Street, Town"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Preferences & Notes</label>
            <textarea
              rows={2}
              placeholder="Allergies to heavy detergents, fabric softener preferences..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Customer Order History Modal */}
      {activeCustomer && (
        <Modal
          isOpen={Boolean(activeCustomer)}
          onClose={() => setActiveCustomer(null)}
          title={`Order History: ${activeCustomer.full_name}`}
          size="lg"
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setActiveCustomer(null)}>
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px'
            }}>
              <div>Phone: <strong>{activeCustomer.phone}</strong></div>
              <div>Address: <strong>{activeCustomer.address || '—'}</strong></div>
              <div>
                Outstanding Due:{' '}
                <strong style={{ color: getCustomerStats(activeCustomer.id).totalDue > 0 ? '#b91c1c' : '#047857' }}>
                  {formatCurrency(getCustomerStats(activeCustomer.id).totalDue)}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Status</th>
                    <th>Fulfillment</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {getCustomerStats(activeCustomer.id).custOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No orders recorded yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    getCustomerStats(activeCustomer.id).custOrders.map(ord => (
                      <tr key={ord.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ord.order_number}</td>
                        <td style={{ textTransform: 'capitalize' }}>{ord.status}</td>
                        <td>{ord.fulfillment_type}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(ord.total_amount)}</td>
                        <td style={{ color: '#047857' }}>{formatCurrency(ord.total_paid)}</td>
                        <td style={{ color: ord.balance_due > 0 ? '#b91c1c' : '#047857', fontWeight: 700 }}>
                          {formatCurrency(ord.balance_due)}
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{formatDateTime(ord.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const ordId = ord.id;
                              setActiveCustomer(null);
                              if (onSelectOrder) onSelectOrder(ordId);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
