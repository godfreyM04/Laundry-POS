import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { Tag, Plus, Edit, Check, X, Search, AlertCircle } from 'lucide-react';

export function ServicesScreen() {
  const { isAdmin } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Wash & Fold',
    description: '',
    price: '',
    unit: 'kg',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices(false); // get both active and inactive
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(services.map(s => s.category).filter(Boolean))];

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'Wash & Fold',
      description: '',
      price: '',
      unit: 'kg',
      is_active: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      category: srv.category,
      description: srv.description || '',
      price: srv.price.toString(),
      unit: srv.unit || 'item',
      is_active: srv.is_active ?? true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (srv) => {
    try {
      await updateService(srv.id, { is_active: !srv.is_active });
      await loadServices();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Service name is required');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a non-negative number');
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        await updateService(editingService.id, {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description.trim() || null,
          price: priceNum,
          unit: formData.unit.trim(),
          is_active: formData.is_active
        });
      } else {
        await createService({
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description.trim() || null,
          price: priceNum,
          unit: formData.unit.trim(),
          is_active: formData.is_active
        });
      }

      setIsModalOpen(false);
      await loadServices();
    } catch (err) {
      setFormError(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    if (!matchesCat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
  });

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
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '520px' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search service name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '180px' }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isAdmin && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <Plus size={15} /> Add Service
          </button>
        )}
      </div>

      {/* Services Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Price (KES)</th>
              <th style={{ textAlign: 'center' }}>Unit</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading service catalogue...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No services found.
                </td>
              </tr>
            ) : (
              filteredServices.map(srv => (
                <tr key={srv.id} style={{ opacity: srv.is_active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{srv.name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {srv.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    {srv.description || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(srv.price)}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    / {srv.unit}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: srv.is_active ? '#ecfdf5' : '#f1f5f9',
                      color: srv.is_active ? '#047857' : '#64748b'
                    }}>
                      {srv.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEdit(srv)}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${srv.is_active ? 'btn-ghost' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(srv)}
                        >
                          {srv.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Service Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Laundry Service & Pricing' : 'Add New Laundry Service'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveService} disabled={saving}>
              {saving ? 'Saving...' : editingService ? 'Update Service' : 'Save Service'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div className="alert-box alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              placeholder="e.g. Dry Cleaning: 3-Piece Suit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                placeholder="e.g. Dry Cleaning, Wash & Fold, Bedding"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">Per Kilogram (kg)</option>
                <option value="item">Per Individual Item</option>
                <option value="suit">Per Suit</option>
                <option value="pair">Per Pair (e.g. Shoes)</option>
                <option value="set">Per Set</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (KES) *</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Availability</label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active (Visible in POS)</option>
                <option value="false">Inactive / Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Care Standard</label>
            <textarea
              rows={2}
              placeholder="Eco-solvent wash, fiber revitalization, double-sided steam press..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
