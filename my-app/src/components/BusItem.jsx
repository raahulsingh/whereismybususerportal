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
    >
      <div className="bus-card-top">
        <div className="bus-badge">🚌 {bus.busName}</div>
        {bus.duration && <div className="bus-duration">{bus.duration}</div>}
      </div>

      <div className="bus-route-row">
        <span className="bus-stop-name">{bus.sourceStop}</span>
        <span className="bus-arrow">→</span>
        <span className="bus-stop-name" style={{ textAlign: 'right' }}>{bus.destinationStop}</span>
      </div>

      <div className="bus-times-row">
        <span className="bus-time">{formatTime(bus.departureTime)}</span>
        <span className="bus-time-sep">→</span>
        <span className="bus-time">{formatTime(bus.arrivalTime)}</span>
      </div>
    </li>
  );
}

export default BusItem;