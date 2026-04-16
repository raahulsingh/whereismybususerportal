import React from "react";

export default function StopDropdown({ label, allStops, value, onChange }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim() === ''
    ? allStops
    : allStops.filter(s => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type="text"
        placeholder="Type to search stop..."
        value={value || query}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        style={{
          padding: '12px 16px', fontSize: 15, borderRadius: 10, border: '1.5px solid #e2e8f0',
          outline: 'none', width: '100%', boxSizing: 'border-box'
        }}
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', maxHeight: 220, overflowY: 'auto',
          padding: 0, margin: '4px 0 0', listStyle: 'none',
        }}>
          {filtered.slice(0, 12).map((s, i) => (
            <li key={i}
              onMouseDown={() => { onChange(s); setQuery(s); setOpen(false); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
                background: value === s ? '#eff6ff' : '#fff', color: value === s ? '#2563eb' : '#1e293b',
                fontWeight: value === s ? 600 : 400,
                borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = value === s ? '#eff6ff' : '#fff'}
            >{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}