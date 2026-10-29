import React, { useState, useEffect } from 'react';
import { getStaffProfiles, updateStaffProfile } from '../../lib/api';
import { formatPhone, formatDateTime } from '../../lib/formatters';
import { USER_ROLES, ROLE_LABELS } from '../../lib/constants';
import { Modal } from '../../components/common/Modal';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, Lock, Edit2 } from 'lucide-react';

export function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Staff Modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CASHIER);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffProfiles();
      setStaff(data || []);
    } catch (err) {
      console.error('Failed to load staff profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedStaff(user);
    setSelectedRole(user.role);
    setIsActive(user.is_active ?? true);
    setMessage('');
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setSaving(true);
    try {
      await updateStaffProfile(selectedStaff.id, {
        role: selectedRole,
        is_active: isActive
      });
      setMessage('Staff role and status updated successfully.');
      await loadStaff();
      setTimeout(() => {
        setSelectedStaff(null);
      }, 800);
    } catch (err) {
      console.error('Failed to update staff:', err);
      setMessage(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="var(--primary-600)" />
          Staff Accounts & Role-Based Access Control
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage operational roles and permissions enforced at the Supabase database level via Row Level Security (RLS).
        </p>
      </div>

      {/* Staff Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Phone</th>
              <th>Assigned Role</th>
              <th>Access Permissions</th>
              <th style={{ textAlign: 'center' }}>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading staff directory...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No staff accounts found.
                </td>
              </tr>
            ) : (
              staff.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email || user.id}</div>
                  </td>
                  <td>
                    {formatPhone(user.phone)}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: user.role === USER_ROLES.ADMIN ? '#b45309' : 'var(--text-main)',
                      padding: '3px 8px',
                      background: user.role === USER_ROLES.ADMIN ? '#fef3c7' : '#f1f5f9',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {user.role === USER_ROLES.ADMIN && 'Full business oversight, staff management, financial reports, all operations'}
                    {user.role === USER_ROLES.CASHIER && 'POS, order creation, payment recording, receipts, handover'}
                    {user.role === USER_ROLES.LAUNDRY_STAFF && 'Processing queue, wash/press stages, mark ready notifications'}
                    {user.role === USER_ROLES.DELIVERY_STAFF && 'Delivery routes, customer drop-off confirmation'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: user.is_active ? '#ecfdf5' : '#fee2e2',
                      color: user.is_active ? '#047857' : '#b91c1c'
                    }}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenEdit(user)}
                    >
                      <Edit2 size={13} /> Edit Role
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Staff Role Modal */}
      {selectedStaff && (
        <Modal
          isOpen={Boolean(selectedStaff)}
          onClose={() => setSelectedStaff(null)}
          title={`Edit Permissions: ${selectedStaff.full_name}`}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedStaff(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveStaff}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Save Permissions'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {message && (
              <div className="alert-box alert-success">
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">User Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value={USER_ROLES.ADMIN}>Administrator (Full Access)</option>
                <option value={USER_ROLES.CASHIER}>Cashier (POS & Front Desk)</option>
                <option value={USER_ROLES.LAUNDRY_STAFF}>Laundry Staff (Washing & Ironing)</option>
                <option value={USER_ROLES.DELIVERY_STAFF}>Delivery Staff (Dispatch)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Active (Permitted Access)</option>
                <option value="false">Suspended / Deactivated</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
