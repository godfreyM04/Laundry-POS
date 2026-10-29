import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearCustomSupabaseConfig, 
  testSupabaseConnection, 
  sanitizeSupabaseUrl, 
  isSecretKey 
} from '../../lib/supabase';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

export function SupabaseConfigModal({ isOpen, onClose }) {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const keyIsSecret = isSecretKey(anonKey);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = sanitizeSupabaseUrl(url);
      const result = await testSupabaseConnection(cleanUrl, anonKey.trim());
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (keyIsSecret) {
      alert('Cannot save: You provided a Secret API key (service_role). Supabase prohibits using secret keys in frontend browser applications. Please use the public anon key.');
      return;
    }
    const cleanUrl = sanitizeSupabaseUrl(url);
    saveSupabaseConfig(cleanUrl, anonKey);
    window.location.reload();
  };

  const handleResetToDemo = () => {
    clearCustomSupabaseConfig();
    window.location.reload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Database Configuration"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleResetToDemo}>
            Reset to Demo DB
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing || !url || !anonKey}
          >
            {testing ? <RefreshCw size={14} className="spin-slow" /> : null}
            Test Connection
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!url || !anonKey || keyIsSecret}
          >
            Save & Connect
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="alert-box alert-info">
          <Database size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px' }}>
            <strong>Direct PostgreSQL Connection via Supabase:</strong>
            <p style={{ marginTop: '3px' }}>
              Connect directly using your project URL and <strong>anon (public) key</strong>.
            </p>
          </div>
        </div>

        {keyIsSecret && (
          <div className="alert-box alert-danger">
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              <strong>Secret API Key Detected (Forbidden in Browser):</strong>
              <p style={{ marginTop: '3px' }}>
                You entered a secret key (starting with <code>sb_secret_</code> or service_role). Supabase strictly prohibits using secret keys in frontend client applications because they bypass Row Level Security.
              </p>
              <p style={{ marginTop: '5px', fontWeight: 600 }}>
                Please go to Supabase Dashboard &gt; Project Settings &gt; API, and copy the <strong>anon (public) key</strong> instead.
              </p>
            </div>
          </div>
        )}

        {testResult && (
          <div className={`alert-box ${testResult.ok ? 'alert-success' : 'alert-danger'}`}>
            {testResult.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div style={{ fontSize: '13px' }}>
              <strong>{testResult.ok ? 'Connection Verified' : 'Connection Failed'}</strong>
              <p style={{ marginTop: '2px' }}>
                {testResult.message || testResult.error}
              </p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Supabase Project URL
            <span className="form-helper">Found in Project Settings &gt; API</span>
          </label>
          <input
            type="text"
            placeholder="https://your-project-id.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {url.includes('/rest/v1') && (
            <span style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
              Note: Trailing <code>/rest/v1/</code> will be automatically trimmed to <code>{sanitizeSupabaseUrl(url)}</code>.
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Supabase Anon (Public) Key
            <span className="form-helper">Project Settings &gt; API &gt; "anon" "public" key</span>
          </label>
          <input
            type="text"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
          />
        </div>

        <div style={{
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
            Where to find your Anon Public Key:
          </strong>
          <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>supabase.com/dashboard</a></li>
            <li>Select your project &gt; <strong>Project Settings</strong> (gear icon) &gt; <strong>API</strong></li>
            <li>Under <strong>Project API keys</strong>, look for the row labeled <strong>anon</strong> / <strong>public</strong>.</li>
            <li>Copy that key (it usually starts with <code>eyJ...</code>) and paste it here or into <code>.env</code>.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}
