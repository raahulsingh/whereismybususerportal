import React, { useEffect, useState } from "react";
import { fmt } from "../utils/bookingUtils";
import { getApiUrl } from "../apiConfig";

// ── Step 3: Seat Layout ──────────────────────────────────────────
export default function SeatLayout({ trip, searchInfo, onSeatBooked, onGoToPayment, user }) {
  const [layout, setLayout] = useState(null);
  const [booked, setBooked] = useState([]);
  const [selected, setSelected] = useState([]); // Array of { seatNo, type, price }
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('seats');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [viewDeck, setViewDeck] = useState('lower');
  const [passengers, setPassengers] = useState([]);

  const seatPrice = Number(trip.price);
  const sleeperPrice = trip.sleeperPrice ? Number(trip.sleeperPrice) : seatPrice * 1.5;

  const generateLayout = () => {
    const cols = ['A', 'B', 'C', 'D'];
    const seats = [];
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 4; col++)
        seats.push({ seatNo: cols[col] + (row + 1), row, col, type: 'seat', deck: 'lower' });
    return seats;
  };

  useEffect(() => {
    fetch(getApiUrl(`/api/booking/trips/${trip.tripId}/seats?date=${encodeURIComponent(searchInfo.date || '')}&fromStop=${encodeURIComponent(searchInfo.from || '')}&toStop=${encodeURIComponent(searchInfo.to || '')}`))
      .then(r => { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(d => {
        if (d.layoutJson) {
          try {
            const parsed = JSON.parse(d.layoutJson);
            if (parsed.length > 0) {
              const normalized = parsed.map(s => ({
                ...s, type: s.type || 'seat', deck: s.deck || 'lower',
              }));
              setLayout(normalized);
            } else { setLayout(generateLayout()); }
          } catch { setLayout(generateLayout()); }
        } else { setLayout(generateLayout()); }
        setBooked(d.bookedSeats || []);
      })
      .catch(() => { setLayout(generateLayout()); setBooked([]); })
      .finally(() => setLoading(false));
  }, [trip.tripId]);

  const hasUpperDeck = layout ? layout.some(s => s.deck === 'upper') : false;
  const deckSeats = layout ? layout.filter(s => (s.deck || 'lower') === viewDeck) : [];
  const rows = deckSeats.length > 0 ? [...new Set(deckSeats.map(s => s.row))].sort((a, b) => a - b) : [];
  const cols = deckSeats.length > 0 ? [...new Set(deckSeats.map(s => s.col))].sort((a, b) => a - b) : [];

  const getPriceForType = (type) => type === 'sleeper' ? sleeperPrice : seatPrice;

  const toggleSeat = (seatNo, seatType) => {
    setSelected(prev => {
      if (prev.find(s => s.seatNo === seatNo)) return prev.filter(s => s.seatNo !== seatNo);
      return [...prev, { seatNo, type: seatType || 'seat', price: getPriceForType(seatType || 'seat') }];
    });
  };

  const totalAmount = selected.reduce((sum, s) => sum + s.price, 0);

  const goToPassenger = () => {
    if (selected.length === 0) { setError('Select at least one seat'); return; }
    setError('');
    setPassengers(selected.map((seat, i) => {
      if (i === 0 && user) return { seatNo: seat.seatNo, name: user.name || '', age: user.age || '', gender: 'Male', phone: user.phone || '', email: user.email || '' };
      return { seatNo: seat.seatNo, name: '', age: '', gender: 'Male', phone: '', email: '' };
    }));
    setStep('passenger');
  };

  const updatePassenger = (idx, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const confirmBooking = () => {
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim() || !passengers[i].phone.trim()) {
        setError(`Passenger ${i + 1} (Seat ${passengers[i].seatNo}): Name and phone number are required.`);
        return;
      }
    }
    setError('');
    if (onGoToPayment) onGoToPayment(selected, passengers);
  };

  const inp = { padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading seats…</div>;

  const aisleAfter = 1; // aisle gap after column index 1

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 22px', marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>🚌 {trip.busCode} — {trip.routeName}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span>{fmt(trip.fromTime)} → {fmt(trip.toTime)}</span>
          <span style={{ color: '#16a34a', fontWeight: 700 }}>💺 ₹{seatPrice.toFixed(0)}</span>
          {sleeperPrice !== seatPrice && <span style={{ color: '#7c3aed', fontWeight: 700 }}>🛏️ ₹{sleeperPrice.toFixed(0)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['seats', 'passenger'].map((s, i) => (
            <div key={s} style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: step === s ? '#2563eb' : '#f1f5f9', color: step === s ? '#fff' : '#64748b'
            }}>
              {i + 1}. {s === 'seats' ? 'Select Seats' : 'Passenger Info'}
            </div>
          ))}
        </div>
      </div>

      {/* ── SEAT SELECTION ── */}
      {step === 'seats' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 16, fontSize: 12, flexWrap: 'wrap' }}>
            {[
              ['linear-gradient(135deg, #ecfdf5, #d1fae5)', '#22c55e', '💺 Seat'],
              ['linear-gradient(135deg, #ede9fe, #ddd6fe)', '#a78bfa', '🛏️ Sleeper'],
              ['#fef9c3', '#f59e0b', '✅ Selected'],
              ['#f1f5f9', '#cbd5e1', '🚫 Booked'],
            ].map(([bg, col, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: label.includes('Sleeper') ? 32 : 20, background: bg, border: `2px solid ${col}`, borderRadius: 5 }} />
                <span style={{ color: '#475569' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Deck tabs */}
          {hasUpperDeck && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[['lower', '⬇️ Lower Deck', '#2563eb'], ['upper', '⬆️ Upper Deck', '#7c3aed']].map(([d, lbl, clr]) => (
                <button key={d} onClick={() => setViewDeck(d)} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  background: viewDeck === d ? clr : '#f1f5f9',
                  color: viewDeck === d ? '#fff' : '#64748b',
                }}>{lbl}</button>
              ))}
            </div>
          )}

          {/* Driver */}
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 20 }}>🚗 Driver</div>

          {/* Seat Grid */}
          <div className="seat-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {rows.map(row => (
              <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ width: 22, fontSize: 11, color: '#94a3b8', textAlign: 'right', paddingTop: 18 }}>{row + 1}</div>
                {cols.map(col => {
                  const seat = deckSeats.find(s => s.row === row && s.col === col);
                  if (!seat) return (
                    <React.Fragment key={col}>
                      {col === aisleAfter + 1 && <div style={{ width: 24 }} />}
                      <div style={{ width: 54 }} />
                    </React.Fragment>
                  );

                  const isBooked = booked.includes(seat.seatNo);
                  const isSelected = selected.some(s => s.seatNo === seat.seatNo);
                  const isSleeper = seat.type === 'sleeper';
                  const price = getPriceForType(seat.type);

                  const seatH = isSleeper ? 120 : 58;

                  let bg, border, color;
                  if (isBooked) {
                    bg = '#f1f5f9'; border = '2px solid #cbd5e1'; color = '#94a3b8';
                  } else if (isSelected) {
                    bg = '#fef9c3'; border = '2px solid #f59e0b'; color = '#854d0e';
                  } else if (isSleeper) {
                    bg = 'linear-gradient(135deg, #ede9fe, #ddd6fe)'; border = '2px solid #a78bfa'; color = '#5b21b6';
                  } else {
                    bg = 'linear-gradient(135deg, #ecfdf5, #d1fae5)'; border = '2px solid #6ee7b7'; color = '#15803d';
                  }

                  return (
                    <React.Fragment key={col}>
                      {col === aisleAfter + 1 && <div style={{ width: 24 }} />}
                      <div onClick={() => !isBooked && toggleSeat(seat.seatNo, seat.type)}
                        title={`${seat.seatNo} — ${isSleeper ? 'Sleeper' : 'Seat'} ₹${price}`}
                        style={{
                          width: 54, height: seatH, borderRadius: isSleeper ? 14 : 10,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          cursor: isBooked ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                          background: bg, border, color,
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: isSelected ? '0 0 0 3px #fcd34d55' : '0 1px 4px rgba(0,0,0,0.07)',
                        }}>
                        <span style={{ fontSize: isSleeper ? 26 : 18 }}>
                          {isBooked ? '🚫' : isSelected ? '✅' : isSleeper ? '🛏️' : '💺'}
                        </span>
                        <span style={{ fontSize: 11 }}>{seat.seatNo}</span>
                        {!isBooked && <span style={{ fontSize: 9, color: isSelected ? '#854d0e' : color, marginTop: 1 }}>₹{price.toFixed(0)}</span>}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected summary bar */}
          <div className="mobile-col" style={{
            marginTop: 20, padding: '14px 18px', background: selected.length > 0 ? '#eff6ff' : '#f8fafc',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            border: '1.5px solid ' + (selected.length > 0 ? '#bfdbfe' : '#e2e8f0')
          }}>
            <div style={{ flex: 1 }}>
              {selected.length === 0
                ? <span style={{ color: '#94a3b8', fontSize: 14 }}>Select seat(s)</span>
                : <>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {selected.length} seat{selected.length > 1 ? 's' : ''}: {selected.map(s => s.seatNo).join(', ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {selected.filter(s => s.type === 'seat').length > 0 && <span style={{ marginRight: 10 }}>💺 {selected.filter(s => s.type === 'seat').length} × ₹{seatPrice.toFixed(0)}</span>}
                    {selected.filter(s => s.type === 'sleeper').length > 0 && <span>🛏️ {selected.filter(s => s.type === 'sleeper').length} × ₹{sleeperPrice.toFixed(0)}</span>}
                  </div>
                  <div style={{ fontSize: 14, color: '#2563eb', fontWeight: 700, marginTop: 2 }}>Total: ₹{totalAmount.toFixed(0)}</div>
                </>
              }
            </div>
            <button className="mobile-w-100" onClick={goToPassenger} disabled={selected.length === 0} style={{
              padding: '12px 24px', background: selected.length > 0 ? '#16a34a' : '#cbd5e1', color: '#fff',
              border: 'none', borderRadius: 8, padding: '10px 22px',
              fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', fontSize: 14
            }}>
              Continue →
            </button>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>⚠ {error}</div>}
        </div>
      )}

      {/* ── PASSENGER FORMS ── */}
      {step === 'passenger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {passengers.map((p, idx) => {
            const seatInfo = selected.find(s => s.seatNo === p.seatNo);
            const isSleeper = seatInfo && seatInfo.type === 'sleeper';
            return (
              <div key={p.seatNo} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: isSleeper ? '#7c3aed' : '#2563eb' }}>
                  {isSleeper ? '🛏️' : '💺'} {isSleeper ? 'Sleeper' : 'Seat'} {p.seatNo} — Passenger {idx + 1}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 8 }}>₹{(seatInfo?.price || seatPrice).toFixed(0)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>FULL NAME *</label>
                    <input style={inp} placeholder="Passenger name" value={p.name} onChange={e => updatePassenger(idx, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>AGE</label>
                    <input style={inp} type="number" placeholder="Age" value={p.age} onChange={e => updatePassenger(idx, 'age', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>GENDER</label>
                    <select style={inp} value={p.gender} onChange={e => updatePassenger(idx, 'gender', e.target.value)}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PHONE *</label>
                    <input style={inp} placeholder="Mobile number" value={p.phone} onChange={e => updatePassenger(idx, 'phone', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EMAIL</label>
                    <input style={inp} type="email" placeholder="Email (optional)" value={p.email} onChange={e => updatePassenger(idx, 'email', e.target.value)} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 700 }}>{selected.length} Seat{selected.length > 1 ? 's' : ''}: {selected.map(s => s.seatNo).join(', ')}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {selected.filter(s => s.type === 'seat').length > 0 && <span>💺 {selected.filter(s => s.type === 'seat').length} × ₹{seatPrice.toFixed(0)}</span>}
                {selected.filter(s => s.type === 'sleeper').length > 0 && <span style={{ marginLeft: 8 }}>🛏️ {selected.filter(s => s.type === 'sleeper').length} × ₹{sleeperPrice.toFixed(0)}</span>}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>₹{totalAmount.toFixed(0)}</div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>⚠ {error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('seats')}
              style={{ padding: '12px 22px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              ← Back
            </button>
            <button onClick={confirmBooking}
              style={{
                flex: 1, padding: '12px', background: 'linear-gradient(135deg, #e65100, #ff8f00)', color: '#fff',
                border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15,
                boxShadow: '0 4px 14px rgba(230,81,0,0.3)'
              }}>
              💳 Proceed to Payment — ₹{totalAmount.toFixed(0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}