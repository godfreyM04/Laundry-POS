import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { getCustomers, createCustomer } from '../../lib/api';
import { isValidPhone, formatPhone } from '../../lib/formatters';
import { Search, UserPlus, Phone, MapPin, Check, AlertCircle } from 'lucide-react';

export function CustomerSelectModal({ isOpen, onClose, onSelectCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New customer form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers(search);
    }
  }, [isOpen, search]);

  const loadCustomers = async (query) => {
    setLoading(true);
    try {
      const data = await getCustomers(query);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name.trim()) {
      setFormError('Customer full name is required');
      return;
    }

    if (!isValidPhone(formData.phone)) {
      setFormError('Please enter a valid phone number (e.g. +254712345678 or 0712345678)');
      return;
    }

    setSaving(true);
    try {
      const created = await createCustomer({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null
      });

      onSelectCustomer(created);
      onClose();
      // Reset form
      setFormData({ full_name: '', phone: '', email: '', address: '', notes: '' });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showAddForm ? 'Register New Customer' : 'Select Customer for Order'}
      size="md"
      footer={
        showAddForm ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setShowAddForm(false); setFormError(''); }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateCustomer}
              disabled={saving}
            >
              {saving ? 'Registering...' : 'Save & Select Customer'}
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddForm(true)}
            >
              <UserPlus size={16} /> New Customer
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        )
      }
    >
      {showAddForm ? (
        <form onSubmit={handleCreateCustomer}>
          {formError && (
            <div className="alert-box alert-danger" style={{ marginBottom: '14px' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Grace Wanjiku"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                placeholder="e.g. +254 712 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address / Residence</label>
            <input
              type="text"
              placeholder="Apartment, Street, Area"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Preferences / Notes</label>
            <textarea
              rows={2}
              placeholder="Fabric sensitivities, special wash instructions, preferred fragrance..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer name, phone number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Searching customers...
              </div>
            ) : customers.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  No customer matching "{search}"
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, phone: search.match(/^\+?\d+$/) ? search : '', full_name: !search.match(/^\+?\d+$/) ? search : '' }));
                    setShowAddForm(true);
                  }}
                >
                  <UserPlus size={14} /> Register "{search}" as New Customer
                </button>
              </div>
            ) : (
              customers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    onSelectCustomer(cust);
                    onClose();
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                      {cust.full_name}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '3px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {formatPhone(cust.phone)}
                      </span>
                      {cust.address && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {cust.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary">
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
