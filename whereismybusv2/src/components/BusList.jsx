import { fmtDate, fmt, duration } from "../utils/bookingUtils";
// ── Step 2: Bus Results ──────────────────────────────────────────


export default function BusList({ results, searchInfo, onSelect }) {
  // ── Frontend cutoff logic (IST) ──
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const now = new Date(nowStr);

  const filteredResults = (results || []).filter(bus => {
    if (!bus.tripStartTime) return true; // Safety fallback
    const tripStart = new Date(bus.tripStartTime.replace(' ', 'T'));
    // Cutoff = tripStart - 5 minutes
    const cutoff = new Date(tripStart.getTime() - (5 * 60 * 1000));
    return now < cutoff;
  });

  if (!filteredResults || filteredResults.length === 0) {
    const isFiltered = results && results.length > 0;
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 16 }}>
        {isFiltered ? "🕒 Booking closed for all buses on this route today." : "😔 No buses found on this route."}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '24px auto' }}>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
        <strong>{filteredResults.length} buses</strong> found — {searchInfo.from} → {searchInfo.to} · {searchInfo.date ? fmtDate(searchInfo.date) : ''}
      </div>
      {filteredResults.map((bus, i) => {
        const hasSleeperPrice = bus.sleeperPrice && Number(bus.sleeperPrice) !== Number(bus.price);
        return (
          <div key={i} onClick={() => onSelect(bus)} style={{
            background: '#fff', borderRadius: 12, padding: '18px 22px', marginBottom: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)', cursor: 'pointer',
            border: '1.5px solid transparent', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className="trip-card-row mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1e293b' }}>🚌 {bus.busName || 'Express Bus'}</div>
                  <span style={{ 
                    background: '#f1f5f9', color: '#64748b', fontSize: 11, 
                    fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    border: '1px solid #e2e8f0'
                  }}>#{bus.busCode}</span>
                </div>
                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                  {bus.fromStopName} <span style={{ color: '#94a3b8', margin: '0 4px' }}>→</span> {bus.toStopName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>₹{Number(bus.price).toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>💺 Seat</div>
                  </div>
                  {hasSleeperPrice && (
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>₹{Number(bus.sleeperPrice).toFixed(0)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>🛏️ Sleeper</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="trip-times-col mobile-col" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(bus.fromTime)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{bus.fromStopName}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                ──── {duration(bus.fromTime, bus.toTime)} ────
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(bus.toTime)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{bus.toStopName}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span style={{
                background: bus.availableSeats > 10 ? '#f0fdf4' : '#fef9c3',
                color: bus.availableSeats > 10 ? '#16a34a' : '#854d0e',
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
              }}>
                🪑 {bus.availableSeats} seats available
              </span>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
                Select Seat →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
