import { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';
import StopDropdown from './StopDropdown';
import { todayStr } from '../utils/bookingUtils';
// ── Step 1: Search Form ──────────────────────────────────────────



export default function SearchSection({ onResults }) {
  const [form, setForm] = useState({ from: '', to: '', date: todayStr() });
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load all stop names for dropdown
  useEffect(() => {
    fetch(getApiUrl('/api/stops'))
      .then(r => r.json())
      .then(d => {
        const names = [...new Set((Array.isArray(d) ? d : []).map(s => s.name).filter(Boolean))];
        setAllStops(names.sort());
      })
      .catch(() => { });
  }, []);

  const search = async () => {
    if (!form.from || !form.to || !form.date) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(getApiUrl('/api/booking/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromStop: form.from, toStop: form.to, date: form.date }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onResults(data, form);
    } catch { setError('Search failed. Check backend endpoint.'); }
    finally { setLoading(false); }
  };

  // Today / Tomorrow quick buttons
  const setDay = (offset) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    setForm(f => ({ ...f, date: new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0] }));
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 28, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🎫 Search Bus Tickets</div>

      <div className="search-box-container mobile-col" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end', marginBottom: 14 }}>
        <StopDropdown label="FROM" allStops={allStops} value={form.from} onChange={v => setForm(f => ({ ...f, from: v }))} />
        {/* Swap button */}
        <button onClick={() => setForm(f => ({ ...f, from: f.to, to: f.from }))}
          style={{
            marginBottom: 2, width: 38, height: 44, borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
          ⇄
        </button>
        <StopDropdown label="TO" allStops={allStops} value={form.to} onChange={v => setForm(f => ({ ...f, to: v }))} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>DATE OF JOURNEY</label>
        <div className="mobile-wrap" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={form.date} min={todayStr()}
            className="mobile-w-100"
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ flex: 1, padding: '12px 16px', fontSize: 15, borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }} />
          <button onClick={() => setDay(0)} style={{
            padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: form.date === todayStr() ? '#eff6ff' : '#f8fafc', color: form.date === todayStr() ? '#2563eb' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap'
          }}>Today</button>
          <button onClick={() => setDay(1)} style={{
            padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap'
          }}>Tomorrow</button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>⚠ {error}</div>}
      <button onClick={search} disabled={loading} style={{
        width: '100%', padding: '14px', background: '#2563eb', color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer',
      }}>
        {loading ? '🔍 Searching…' : '🔍 Search Buses'}
      </button>
    </div>
  );
}