import React from 'react';

function formatTime(t) {
  if (!t) return '---';
  const d = new Date(t);
  if (isNaN(d)) return t;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function BusItem({ bus, onClick }) {
  return (
    <li
      className="bus-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }}
      style={{ padding: '16px', cursor: 'pointer' }}
    >
      <div className="bus-card-top" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>🚌 {bus.busName || 'Express Bus'}</div>
        <span style={{ 
          background: '#f1f5f9', color: '#64748b', fontSize: 11, 
          fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          border: '1px solid #e2e8f0'
        }}>{bus.busCode}</span>
        {bus.duration && <div className="bus-duration" style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>{bus.duration}</div>}
      </div>

      <div className="bus-route-row" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 10 }}>
        {bus.sourceStop} <span style={{ color: '#94a3b8', margin: '0 4px' }}>→</span> {bus.destinationStop}
      </div>

      <div className="bus-times-row" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700 }}>
        <span className="bus-time">{formatTime(bus.departureTime)}</span>
        <span style={{ color: '#cbd5e1', fontWeight: 400 }}>→</span>
        <span className="bus-time">{formatTime(bus.arrivalTime)}</span>
      </div>
    </li>
  );
}

export default BusItem;