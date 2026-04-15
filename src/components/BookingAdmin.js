import { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';

function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw.trim()) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch(getApiUrl('/api/booking/admin/login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) onLogin();
      else setErr('Wrong password.');
    } catch { setErr('Server error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#f0f4f8', gap: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)', minWidth: 340,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
        <div style={{ fontSize: 44 }}>🎫</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Booking Admin Login</div>
        <input
          type="password" placeholder="Booking admin password" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            padding: '11px 16px', fontSize: 15, borderRadius: 9,
            border: '1.5px solid #cbd5e1', width: '100%', boxSizing: 'border-box',
            outline: 'none',
          }} autoFocus />
        {err && <div style={{ color: '#ef4444', fontSize: 13, alignSelf: 'flex-start' }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{
          width: '100%', padding: '11px 0', background: '#16a34a', color: '#fff',
          border: 'none', borderRadius: 9, fontSize: 15, cursor: 'pointer', fontWeight: 600,
        }}>
          {loading ? 'Checking…' : 'Enter Booking Panel'}
        </button>
      </div>
    </div>
  );
}

export default function BookingAdmin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loadingB, setLoadingB] = useState(false);

  const [pricing, setPricing] = useState([]);
  const [editPrice, setEditPrice] = useState({});

  const [pwForm, setPwForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  const inp = {
    padding: '8px 12px', fontSize: 14, borderRadius: 7,
    border: '1.5px solid #cbd5e1', outline: 'none', background: '#fff',
  };

  const btn = (variant = 'primary') => ({
    padding: '8px 18px', fontSize: 13, borderRadius: 7, cursor: 'pointer',
    border: 'none', fontWeight: 600,
    background:
      variant === 'danger' ? '#ef4444' :
      variant === 'secondary' ? '#e2e8f0' :
      variant === 'green' ? '#16a34a' : '#2563eb',
    color: variant === 'secondary' ? '#334155' : '#fff',
  });

  const tabStyle = (active) => ({
    padding: '9px 22px', fontSize: 14, borderRadius: 8, cursor: 'pointer',
    border: 'none', fontWeight: active ? 700 : 500,
    background: active ? '#2563eb' : '#f1f5f9',
    color: active ? '#fff' : '#475569',
    transition: 'all 0.15s',
  });

  const loadBookings = async (date) => {
    setLoadingB(true);
    const d = date !== undefined ? date : dateFilter;
    const url = d ? getApiUrl(`/api/booking/admin/bookings?date=${d}`) : getApiUrl('/api/booking/admin/bookings');
    try {
      const data = await fetch(url).then(r => r.json());
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setLoadingB(false); }
  };

  const loadPricing = async () => {
    const data = await fetch(getApiUrl('/api/booking/admin/pricing')).then(r => r.json());
    setPricing(Array.isArray(data) ? data : []);
  };

  useEffect(() => { if (authed) { loadBookings(''); loadPricing(); } }, [authed]);

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await fetch(getApiUrl(`/api/booking/admin/bookings/${id}/cancel`), { method: 'PUT' });
    loadBookings();
  };

  const savePrice = async (routeId) => {
    const price = editPrice[routeId];
    if (!price) return;
    await fetch(getApiUrl(`/api/booking/admin/pricing/${routeId}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: Number(price) }),
    });
    setEditPrice(p => ({ ...p, [routeId]: '' }));
    loadPricing();
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('❌ New passwords do not match'); return; }
    const res = await fetch(getApiUrl('/api/booking/admin/password'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: pwForm.current, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwMsg(data.success ? '✅ Password changed!' : '❌ ' + data.error);
    if (data.success) setPwForm({ current: '', newPassword: '', confirm: '' });
  };

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  const thStyle = {
    padding: '11px 14px', textAlign: 'left', fontWeight: 700,
    fontSize: 12, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap',
    borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
  };
  const tdStyle = { padding: '11px 14px', fontSize: 13, whiteSpace: 'nowrap' };

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4f8',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎫</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Booking Admin Panel</span>
        </div>
        <button style={{ ...btn('secondary'), fontSize: 13 }} onClick={() => setAuthed(false)}>
          Logout
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '28px 32px', maxWidth: '100%', boxSizing: 'border-box' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['bookings', 'pricing', 'password'].map(t => (
            <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
              {{ bookings: '📋 Bookings', pricing: '💰 Pricing', password: '🔐 Password' }[t]}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS TAB ── */}
        {tab === 'bookings' && (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {/* Filter bar */}
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
            }}>
              <input type="date" style={{ ...inp, fontSize: 13 }}
                value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
              <button style={btn()} onClick={() => loadBookings(dateFilter)}>🔍 Filter</button>
              <button style={btn('secondary')} onClick={() => { setDateFilter(''); loadBookings(''); }}>Clear</button>
              <span style={{
                marginLeft: 'auto', fontSize: 13, color: '#64748b',
                background: '#f1f5f9', padding: '6px 14px', borderRadius: 20, fontWeight: 600,
              }}>
                {bookings.length} bookings
              </span>
            </div>

            {/* Table */}
            {loadingB ? (
              <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center' }}>Loading…</div>
            ) : bookings.length === 0 ? (
              <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center' }}>No bookings found.</div>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr>
                      {['Booking ID', 'Bus', 'Route', 'Seat', 'Passenger', 'Phone', 'From → To', 'Travel Date', 'Booked At', 'Amount', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ ...thStyle, ...(h === 'Action' ? { position: 'sticky', right: 0, background: '#f8fafc', zIndex: 2, boxShadow: '-2px 0 6px rgba(0,0,0,0.06)' } : {}) }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={b.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: b.status === 'cancelled' ? '#fff5f5' : i % 2 === 0 ? '#fff' : '#fafbfc',
                      }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#2563eb', fontSize: 11 }}>
                          {b.booking_ref || b.bookingRef}
                        </td>
                        <td style={{ ...tdStyle }}>
                          <span style={{
                            background: '#eff6ff', color: '#2563eb',
                            padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12,
                          }}>{b.busCode}</span>
                        </td>
                        <td style={{ ...tdStyle, color: '#475569', fontSize: 12 }}>{b.routeName}</td>
                        <td style={{ ...tdStyle }}>
                          <span style={{
                            background: '#f1f5f9', padding: '3px 9px',
                            borderRadius: 6, fontWeight: 700, fontSize: 13,
                          }}>{b.seat_no || b.seatNo}</span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{b.passenger_name || b.passengerName}</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: '#64748b' }}>
                          {b.passenger_phone || b.passengerPhone}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>
                          <span style={{ color: '#475569' }}>
                            {b.from_stop_name || b.fromStopName}
                          </span>
                          <span style={{ color: '#94a3b8', margin: '0 4px' }}>→</span>
                          <span style={{ color: '#475569' }}>
                            {b.to_stop_name || b.toStopName}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#2563eb', fontWeight: 700 }}>
                          {b.travel_date
                            ? new Date(b.travel_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8' }}>
                          {b.booked_at
                            ? new Date(b.booked_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>
                          ₹{Number(b.amount).toFixed(0)}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: b.status === 'confirmed' ? '#f0fdf4' : '#fef2f2',
                            color: b.status === 'confirmed' ? '#16a34a' : '#ef4444',
                            border: `1px solid ${b.status === 'confirmed' ? '#bbf7d0' : '#fecaca'}`,
                          }}>{b.status}</span>
                        </td>
                        <td style={{
                          ...tdStyle,
                          position: 'sticky', right: 0,
                          background: b.status === 'cancelled' ? '#fff5f5' : i % 2 === 0 ? '#fff' : '#fafbfc',
                          boxShadow: '-3px 0 8px rgba(0,0,0,0.07)',
                        }}>
                          {b.status === 'confirmed' && (
                            <button
                              style={{ ...btn('danger'), padding: '5px 12px', fontSize: 11 }}
                              onClick={() => cancelBooking(b.id)}>
                              Cancel
                            </button>
                          )}
                          {b.status === 'cancelled' && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PRICING TAB ── */}
        {tab === 'pricing' && (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 28 }}>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Set the base price for each route. This price will be displayed during seat booking.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pricing.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', background: '#f8fafc',
                  borderRadius: 10, border: '1px solid #e2e8f0',
                }}>
                  <div style={{ flex: 1, fontWeight: 600, color: '#1e293b' }}>🛣 {p.routeName}</div>
                  <div style={{
                    color: '#16a34a', fontWeight: 700, fontSize: 17,
                    minWidth: 80, textAlign: 'right',
                  }}>₹{Number(p.base_price || p.basePrice).toFixed(0)}</div>
                  <input
                    style={{ ...inp, width: 110 }}
                    type="number" min="0"
                    placeholder="New price"
                    value={editPrice[p.route_id || p.routeId] || ''}
                    onChange={e => setEditPrice(prev => ({ ...prev, [p.route_id || p.routeId]: e.target.value }))}
                  />
                  <button style={btn('green')} onClick={() => savePrice(p.route_id || p.routeId)}>Update</button>
                </div>
              ))}
              {pricing.length === 0 && (
                <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>
                  No routes found. Please add a route first.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASSWORD TAB ── */}
        {tab === 'password' && (
          <div style={{
            background: '#fff', borderRadius: 14,
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            padding: 36, maxWidth: 440,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              Change Password
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Change the booking admin password.
            </div>
            {[
              ['Current Password', 'current'],
              ['New Password', 'newPassword'],
              ['Confirm New Password', 'confirm'],
            ].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
                  {label}
                </label>
                <input type="password"
                  style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
                  value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            {pwMsg && (
              <div style={{
                marginBottom: 16, fontSize: 13, padding: '10px 14px',
                borderRadius: 8,
                background: pwMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                color: pwMsg.startsWith('✅') ? '#16a34a' : '#ef4444',
              }}>{pwMsg}</div>
            )}
            <button style={{ ...btn(), width: '100%', padding: '11px 0', fontSize: 14 }} onClick={changePassword}>
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}