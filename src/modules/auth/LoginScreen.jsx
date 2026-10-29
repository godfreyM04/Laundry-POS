import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseLive } from '../../lib/supabase';
import { ROLE_LABELS, USER_ROLES } from '../../lib/constants';
import { Sparkles, Lock, Mail, AlertCircle, User, Phone, CheckCircle2, Database } from 'lucide-react';

export function LoginScreen({ onOpenConfig }) {
  const { loginWithPassword, signUpWithPassword, demoUsers, switchDemoRole } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(USER_ROLES.CASHIER);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isLive = isSupabaseLive();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter an email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithPassword(email, password);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Full name is required');
          setLoading(false);
          return;
        }
        const data = await signUpWithPassword({
          email,
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          role
        });

        if (data?.user && !data?.session) {
          setSuccessMsg('Account created! If email confirmation is enabled in your Supabase project, check your inbox to confirm.');
        } else {
          setSuccessMsg('Staff account created and authenticated successfully!');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #0f766e 0%, #0f172a 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden'
      }}>
        {/* Brand Banner */}
        <div style={{
          padding: '28px 32px 20px',
          textAlign: 'center',
          background: '#f8fafc',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 10px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
          }}>
            <Sparkles size={26} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            LaundryPOS
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Desktop Laundry Management & POS Station
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span style={{
              fontSize: '11px',
              padding: '2px 9px',
              borderRadius: 'var(--radius-full)',
              background: isLive ? '#ecfdf5' : '#fffbeb',
              color: isLive ? '#047857' : '#92400e',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Database size={11} /> {isLive ? 'Supabase Live Connected' : 'Local Demo Mode'}
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            style={{
              padding: '12px',
              fontWeight: 600,
              fontSize: '13px',
              background: mode === 'login' ? '#ffffff' : '#f8fafc',
              color: mode === 'login' ? 'var(--primary-700)' : 'var(--text-muted)',
              borderBottom: mode === 'login' ? '2px solid var(--primary-600)' : 'none'
            }}
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              padding: '12px',
              fontWeight: 600,
              fontSize: '13px',
              background: mode === 'register' ? '#ffffff' : '#f8fafc',
              color: mode === 'register' ? 'var(--primary-700)' : 'var(--text-muted)',
              borderBottom: mode === 'register' ? '2px solid var(--primary-600)' : 'none'
            }}
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Register Staff Account
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 32px' }}>
          {errorMsg && (
            <div className="alert-box alert-danger" style={{ marginBottom: '14px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success" style={{ marginBottom: '14px' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <div className="search-input-wrapper">
                    <User size={15} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="e.g. John Mwangi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <div className="search-input-wrapper">
                      <Phone size={15} className="search-icon" />
                      <input
                        type="tel"
                        className="search-input"
                        placeholder="+254712000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Initial Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{ padding: '7px 8px', fontSize: '13px' }}
                    >
                      <option value={USER_ROLES.CASHIER}>Cashier</option>
                      <option value={USER_ROLES.LAUNDRY_STAFF}>Laundry Staff</option>
                      <option value={USER_ROLES.DELIVERY_STAFF}>Delivery Staff</option>
                      <option value={USER_ROLES.ADMIN}>Administrator</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Staff Email *</label>
              <div className="search-input-wrapper">
                <Mail size={15} className="search-icon" />
                <input
                  type="email"
                  className="search-input"
                  placeholder="cashier@laundrypos.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <div className="search-input-wrapper">
                <Lock size={15} className="search-icon" />
                <input
                  type="password"
                  className="search-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading
                ? mode === 'login' ? 'Signing In...' : 'Registering...'
                : mode === 'login' ? 'Sign In to Station' : 'Create & Sign In'
              }
            </button>
          </form>

          {/* Quick Station Access */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
              Instant Demo Station Access
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '6px 8px',
                    height: 'auto',
                    textAlign: 'left'
                  }}
                  onClick={() => switchDemoRole(u.id)}
                >
                  <span style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--text-main)' }}>
                    {u.full_name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--primary-700)', fontWeight: 500 }}>
                    {ROLE_LABELS[u.role]?.split('/')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '11px', color: 'var(--text-muted)' }}
              onClick={onOpenConfig}
            >
              Configure Supabase Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
