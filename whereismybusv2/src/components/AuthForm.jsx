import React, { useState } from 'react';
import { getApiUrl } from '../apiConfig';

export default function AuthForm({ onSuccess, onCancel }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({
    name: '', email: '', phone: '', age: '', password: '', confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const update = (f) => setForm((prev) => ({ ...prev, ...f }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);

    if (mode === 'register') {
      if (form.password !== form.confirm) { setError("Passwords don't match"); setLoading(false); return; }
      try {
        const res = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Registration failed');
        setSuccessMsg(d.message || 'Registered successfully! App download starting...');

        // Auto-download App
        setTimeout(() => {
          window.open(getApiUrl('/api/app/download'), '_blank');
        }, 1500);

        setMode('login');
        setForm(prev => ({ ...prev, password: '', confirm: '' }));
      } catch (err) { setError(err.message); }
    }
    else if (mode === 'login') {
      try {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Login failed');

        localStorage.setItem('bus_token', d.token);
        if (onSuccess) onSuccess(d.user);
      } catch (err) { setError(err.message); }
    }
    else if (mode === 'forgot') {
      try {
        const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed');
        setSuccessMsg('Reset link sent to your email.');
        setTimeout(() => setMode('login'), 3000);
      } catch (err) { setError(err.message); }
    }

    setLoading(false);
  };

  const inp = { padding: '12px 16px', fontSize: 15, borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)', padding: 20
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, padding: '32px 36px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {onCancel && (
          <button onClick={onCancel} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>
            &times;
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{mode === 'login' ? '👋' : mode === 'register' ? '🎉' : '🔐'}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            {mode === 'login' ? 'Login to book your tickets faster'
              : mode === 'register' ? 'Join us to track and manage your bookings'
                : 'Enter your email to receive a reset link'}
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '10px 14px', borderRadius: 10, color: '#ef4444', fontSize: 13, marginBottom: 20 }}>⚠ {error}</div>}
        {successMsg && <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '10px 14px', borderRadius: 10, color: '#16a34a', fontSize: 13, marginBottom: 20 }}>✅ {successMsg}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {(mode === 'register') && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>FULL NAME</label>
                <input required style={inp} value={form.name} onChange={e => update({ name: e.target.value })} placeholder="John Doe" />
              </div>
              <div style={{ width: 80 }}>
                <label style={lbl}>AGE</label>
                <input type="number" required style={inp} value={form.age} onChange={e => update({ age: e.target.value })} placeholder="25" />
              </div>
            </div>
          )}

          <div>
            <label style={lbl}>EMAIL ADDRESS</label>
            <input required type="email" style={inp} value={form.email} onChange={e => update({ email: e.target.value })} placeholder="email@example.com" />
          </div>

          {(mode === 'register') && (
            <div>
              <label style={lbl}>PHONE NUMBER</label>
              <input required style={inp} value={form.phone} onChange={e => update({ phone: e.target.value })} placeholder="+91 9876543210" />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>PASSWORD</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <input required type="password" style={inp} value={form.password} onChange={e => update({ password: e.target.value })} placeholder="••••••••" />
            </div>
          )}

          {(mode === 'register') && (
            <div>
              <label style={lbl}>CONFIRM PASSWORD</label>
              <input required type="password" style={inp} value={form.confirm} onChange={e => update({ confirm: e.target.value })} placeholder="••••••••" />
            </div>
          )}

          <button disabled={loading} type="submit" style={{
            padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10, boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 12 }}>
            {mode === 'login' ? (
              <>Don't have an account? <button type="button" onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Sign up</button></>
            ) : mode === 'register' ? (
              <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Login</button></>
            ) : (
              <><button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>← Back to Login</button></>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
