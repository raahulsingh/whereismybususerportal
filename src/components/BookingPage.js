import React, { useState, useEffect } from 'react';

// ── Helpers ──────────────────────────────────────────────────────
function fmt(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function duration(from, to) {
  if (!from || !to) return '';
  const m = Math.floor(Math.abs(new Date(to) - new Date(from)) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Stop Dropdown (like Home page) ───────────────────────────────
function StopDropdown({ label, allStops, value, onChange }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen]   = React.useState(false);
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
        style={{ padding: '12px 16px', fontSize: 15, borderRadius: 10, border: '1.5px solid #e2e8f0',
          outline: 'none', width: '100%', boxSizing: 'border-box' }}
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

// ── Step 1: Search Form ──────────────────────────────────────────
function SearchSection({ onResults }) {
  const [form, setForm]     = useState({ from: '', to: '', date: todayStr() });
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Load all stop names for dropdown
  useEffect(() => {
    fetch('/api/stops')
      .then(r => r.json())
      .then(d => {
        const names = [...new Set((Array.isArray(d) ? d : []).map(s => s.name).filter(Boolean))];
        setAllStops(names.sort());
      })
      .catch(() => {});
  }, []);

  const search = async () => {
    if (!form.from || !form.to || !form.date) { setError('Sabhi fields bharein'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromStop: form.from, toStop: form.to, date: form.date }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onResults(data, form);
    } catch { setError('Search failed. Backend check karo.'); }
    finally { setLoading(false); }
  };

  // Today / Tomorrow quick buttons
  const setDay = (offset) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    setForm(f => ({ ...f, date: d.toISOString().split('T')[0] }));
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 28, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🎫 Search Bus Tickets</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end', marginBottom: 14 }}>
        <StopDropdown label="FROM" allStops={allStops} value={form.from} onChange={v => setForm(f => ({...f, from: v}))} />
        {/* Swap button */}
        <button onClick={() => setForm(f => ({ ...f, from: f.to, to: f.from }))}
          style={{ marginBottom: 2, width: 38, height: 44, borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⇄
        </button>
        <StopDropdown label="TO" allStops={allStops} value={form.to} onChange={v => setForm(f => ({...f, to: v}))} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>DATE OF JOURNEY</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={form.date} min={todayStr()}
            onChange={e => setForm(f => ({...f, date: e.target.value}))}
            style={{ flex: 1, padding: '12px 16px', fontSize: 15, borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }} />
          <button onClick={() => setDay(0)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: form.date === todayStr() ? '#eff6ff' : '#f8fafc', color: form.date === todayStr() ? '#2563eb' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Today</button>
          <button onClick={() => setDay(1)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Tomorrow</button>
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

// ── Step 2: Bus Results ──────────────────────────────────────────
function BusList({ results, searchInfo, onSelect }) {
  if (!results || results.length === 0)
    return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 16 }}>😔 Koi bus nahi mili is route par.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '24px auto' }}>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
        <strong>{results.length} buses</strong> mili — {searchInfo.from} → {searchInfo.to} · {fmtDate(searchInfo.date)}
      </div>
      {results.map((bus, i) => (
        <div key={i} onClick={() => onSelect(bus)} style={{
          background: '#fff', borderRadius: 12, padding: '18px 22px', marginBottom: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', cursor: 'pointer',
          border: '1.5px solid transparent', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>🚌 {bus.busCode}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{bus.routeName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>₹{Number(bus.price).toFixed(0)}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>per seat</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
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
            <span style={{ background: bus.availableSeats > 10 ? '#f0fdf4' : '#fef9c3',
              color: bus.availableSeats > 10 ? '#16a34a' : '#854d0e',
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              🪑 {bus.availableSeats} seats available
            </span>
            <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
              Select Seat →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 3: Seat Layout ──────────────────────────────────────────
function SeatLayout({ trip, searchInfo, onSeatBooked }) {
  const [layout, setLayout]     = useState(null);
  const [booked, setBooked]     = useState([]);
  const [selected, setSelected] = useState([]); // ✅ Array for multiple seats
  const [loading, setLoading]   = useState(true);
  const [step, setStep]         = useState('seats'); // 'seats' | 'passenger'
  const [error, setError]       = useState('');
  const [booking, setBooking]   = useState(false);

  // Per-passenger form — one entry per selected seat
  const [passengers, setPassengers] = useState([]);

  const generateLayout = () => {
    const cols = ['A','B','C','D'];
    const seats = [];
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 4; col++)
        seats.push({ seatNo: cols[col]+(row+1), row, col, type: col===0||col===3?'window':'aisle' });
    return seats;
  };

  useEffect(() => {
    fetch(`/api/booking/trips/${trip.tripId}/seats?date=${encodeURIComponent(searchInfo.date || '')}&fromStop=${encodeURIComponent(searchInfo.from || '')}&toStop=${encodeURIComponent(searchInfo.to || '')}`)
      .then(r => { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(d => {
        if (d.layoutJson) {
          try {
            const parsed = JSON.parse(d.layoutJson);
            setLayout(parsed.length > 0 ? parsed : generateLayout());
          } catch { setLayout(generateLayout()); }
        } else { setLayout(generateLayout()); }
        setBooked(d.bookedSeats || []);
      })
      .catch(() => { setLayout(generateLayout()); setBooked([]); })
      .finally(() => setLoading(false));
  }, [trip.tripId]);

  const rows = layout ? [...new Set(layout.map(s => s.row))].sort((a,b)=>a-b) : [];
  const cols = layout ? [...new Set(layout.map(s => s.col))].sort((a,b)=>a-b) : [];

  // Toggle seat selection
  const toggleSeat = (seatNo) => {
    setSelected(prev => {
      if (prev.includes(seatNo)) return prev.filter(s => s !== seatNo);
      return [...prev, seatNo];
    });
  };

  // When moving to passenger step, init passenger forms
  const goToPassenger = () => {
    if (selected.length === 0) { setError('Kam se kam ek seat select karo'); return; }
    setError('');
    setPassengers(selected.map((seatNo, i) => ({
      seatNo, name: '', age: '', gender: 'Male', phone: '', email: ''
    })));
    setStep('passenger');
  };

  const updatePassenger = (idx, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const confirmBooking = async () => {
    // Validate
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim() || !passengers[i].phone.trim()) {
        setError(`Passenger ${i+1} (Seat ${passengers[i].seatNo}): Naam aur phone zaroori hai`);
        return;
      }
    }
    setBooking(true); setError('');
    const refs = [];
    try {
      for (const p of passengers) {
        const res = await fetch('/api/booking/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: trip.tripId,
            seatNo: p.seatNo,
            passengerName: p.name,
            passengerAge: p.age || null,
            passengerGender: p.gender,
            passengerPhone: p.phone,
            passengerEmail: p.email,
            fromStop: searchInfo.from,
            toStop: searchInfo.to,
            amount: trip.price,
            travelDate: searchInfo.date || '', // ✅ date-specific booking
          }),
        });
        const data = await res.json();
        if (data.error) { setError(`Seat ${p.seatNo}: ${data.error}`); setBooking(false); return; }
        refs.push(data.bookingRef);
      }
      // ✅ Mark newly booked seats as blocked in UI immediately
      setBooked(prev => [...prev, ...selected]);
      setSelected([]);
      setStep('seats');
      onSeatBooked({ bookingRefs: refs, count: passengers.length }, trip, selected, passengers);
    } catch { setError('Booking failed. Try again.'); }
    finally { setBooking(false); }
  };

  const totalAmount = selected.length * Number(trip.price);
  const inp = { padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading seats…</div>;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 22px', marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>🚌 {trip.busCode} — {trip.routeName}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          {fmt(trip.fromTime)} → {fmt(trip.toTime)} &nbsp;·&nbsp; ₹{Number(trip.price).toFixed(0)} per seat
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['seats','passenger'].map((s,i) => (
            <div key={s} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: step===s ? '#2563eb' : '#f1f5f9', color: step===s ? '#fff' : '#64748b' }}>
              {i+1}. {s==='seats' ? 'Select Seats' : 'Passenger Info'}
            </div>
          ))}
        </div>
      </div>

      {/* ── SEAT SELECTION ── */}
      {step === 'seats' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
            {[['#f0fdf4','#22c55e','Available'],['#fef9c3','#f59e0b','Selected'],['#f1f5f9','#cbd5e1','Booked']].map(([bg,col,label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 18, height: 18, background: bg, border: `2px solid ${col}`, borderRadius: 4 }} />
                <span style={{ color: '#475569' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Driver */}
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 20 }}>🚗 Driver</div>

          {/* Seat Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {rows.map(row => (
              <div key={row} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 22, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{row+1}</div>
                {cols.map(col => {
                  const seat = layout.find(s => s.row===row && s.col===col);
                  const isBooked   = seat ? booked.includes(seat.seatNo) : false;
                  const isSelected = seat ? selected.includes(seat.seatNo) : false;
                  return (
                    <React.Fragment key={col}>
                      {col === 2 && <div style={{ width: 24 }} />}
                      {seat ? (
                        <div onClick={() => !isBooked && toggleSeat(seat.seatNo)} title={seat.seatNo}
                          style={{
                            width: 54, height: 58, borderRadius: 10,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            cursor: isBooked ? 'not-allowed' : 'pointer', transition: 'all 0.12s',
                            background: isBooked ? '#f1f5f9' : isSelected ? '#fef9c3' : '#f0fdf4',
                            border: `2px solid ${isBooked ? '#cbd5e1' : isSelected ? '#f59e0b' : '#22c55e'}`,
                            color: isBooked ? '#94a3b8' : isSelected ? '#854d0e' : '#15803d',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: isSelected ? '0 0 0 3px #fcd34d55' : '0 1px 4px rgba(0,0,0,0.07)',
                          }}>
                          <span style={{ fontSize: 18 }}>{isBooked ? '🚫' : isSelected ? '✅' : '💺'}</span>
                          <span style={{ fontSize: 12 }}>{seat.seatNo}</span>
                          {!isBooked && <span style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>₹{Number(trip.price).toFixed(0)}</span>}
                        </div>
                      ) : <div style={{ width: 54 }} />}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected summary bar */}
          <div style={{ marginTop: 20, padding: '14px 18px', background: selected.length > 0 ? '#eff6ff' : '#f8fafc',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1.5px solid ' + (selected.length > 0 ? '#bfdbfe' : '#e2e8f0') }}>
            <div>
              {selected.length === 0
                ? <span style={{ color: '#94a3b8', fontSize: 14 }}>Seat(s) select karo</span>
                : <>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {selected.length} seat{selected.length > 1 ? 's' : ''} selected: {selected.join(', ')}
                    </div>
                    <div style={{ fontSize: 13, color: '#2563eb', marginTop: 2 }}>
                      Total: ₹{totalAmount.toFixed(0)}
                    </div>
                  </>
              }
            </div>
            <button onClick={goToPassenger} disabled={selected.length === 0}
              style={{ background: selected.length > 0 ? '#2563eb' : '#cbd5e1', color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px 22px',
                fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', fontSize: 14 }}>
              Continue →
            </button>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>⚠ {error}</div>}
        </div>
      )}

      {/* ── PASSENGER FORMS ── */}
      {step === 'passenger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {passengers.map((p, idx) => (
            <div key={p.seatNo} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#2563eb' }}>
                💺 Seat {p.seatNo} — Passenger {idx + 1}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>FULL NAME *</label>
                  <input style={inp} placeholder="Passenger name"
                    value={p.name} onChange={e => updatePassenger(idx, 'name', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>AGE</label>
                  <input style={inp} type="number" placeholder="Age"
                    value={p.age} onChange={e => updatePassenger(idx, 'age', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>GENDER</label>
                  <select style={inp} value={p.gender} onChange={e => updatePassenger(idx, 'gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PHONE *</label>
                  <input style={inp} placeholder="Mobile number"
                    value={p.phone} onChange={e => updatePassenger(idx, 'phone', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EMAIL</label>
                  <input style={inp} type="email" placeholder="Email (optional)"
                    value={p.email} onChange={e => updatePassenger(idx, 'email', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          {/* Total summary */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{selected.length} Seat{selected.length>1?'s':''}: {selected.join(', ')}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>₹{Number(trip.price).toFixed(0)} × {selected.length}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>₹{totalAmount.toFixed(0)}</div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>⚠ {error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('seats')}
              style={{ padding: '12px 22px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              ← Back
            </button>
            <button onClick={confirmBooking} disabled={booking}
              style={{ flex: 1, padding: '12px', background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
              {booking ? 'Booking…' : `✅ Confirm ${selected.length} Seat${selected.length>1?'s':''} — ₹${totalAmount.toFixed(0)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Booking Confirmed ────────────────────────────────────
function BookingConfirmed({ bookingData, trip, seats, passengers, onDone, onBookMore, searchInfo }) {
  const totalAmount = seats.length * Number(trip.price);
  const printRef = React.useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWin = window.open('', '_blank', 'width=600,height=800');
    printWin.document.write(`
      <html><head><title>Bus Ticket</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
        .ticket { border: 2px dashed #86efac; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #f0fdf4; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { color: #16a34a; margin: 0; }
        .header p { color: #64748b; margin: 4px 0 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .label { color: #64748b; }
        .value { font-weight: 700; }
        .ref { font-size: 18px; font-weight: 800; color: #2563eb; letter-spacing: 1px; }
        .seat-badge { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; }
        .total { background: #eff6ff; padding: 12px 18px; border-radius: 10px; display: flex; justify-content: space-between; font-weight: 700; margin-top: 20px; }
        .total .amt { color: #2563eb; font-size: 18px; }
        .company { text-align: center; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="company">🚌 Where is my Bus</div>
      <div class="header"><h2>Booking Confirmed ✅</h2><p>${fmtDate(searchInfo?.date)} · ${trip.routeName}</p></div>
      ${passengers.map((p, i) => `
        <div class="ticket">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div><div style="font-size:11px;color:#64748b">BOOKING REF</div><div class="ref">${bookingData.bookingRefs?.[i] || '—'}</div></div>
            <span class="seat-badge">Seat ${p.seatNo}</span>
          </div>
          <div class="row"><span class="label">Passenger</span><span class="value">${p.name}</span></div>
          ${p.age ? `<div class="row"><span class="label">Age</span><span class="value">${p.age}</span></div>` : ''}
          <div class="row"><span class="label">Bus</span><span class="value">${trip.busCode}</span></div>
          <div class="row"><span class="label">Route</span><span class="value">${trip.fromStopName} → ${trip.toStopName}</span></div>
          <div class="row"><span class="label">Departure</span><span class="value">${fmt(trip.fromTime)}</span></div>
          <div class="row"><span class="label">Amount</span><span class="value" style="color:#16a34a">₹${Number(trip.price).toFixed(0)}</span></div>
        </div>
      `).join('')}
      <div class="total"><span>Total Paid</span><span class="amt">₹${totalAmount.toFixed(0)}</span></div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div ref={printRef} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>Booking Confirmed!</div>
        <div style={{ color: '#64748b', marginBottom: 20 }}>
          {seats.length} seat{seats.length > 1 ? 's' : ''} booked successfully
        </div>

        {/* Per-seat tickets */}
        {passengers.map((p, i) => (
          <div key={i} style={{ background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 12, padding: 18, textAlign: 'left', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>BOOKING REF</div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, color: '#2563eb' }}>
                  {bookingData.bookingRefs?.[i] || '—'}
                </div>
              </div>
              <div style={{ background: '#2563eb', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                Seat {p.seatNo}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Passenger</span><strong>{p.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bus</span><strong>{trip.busCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Route</span>
                <strong>{trip.fromStopName} → {trip.toStopName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date</span>
                <strong>{fmtDate(searchInfo?.date)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Departure</span><strong>{fmt(trip.fromTime)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount</span>
                <strong style={{ color: '#16a34a' }}>₹{Number(trip.price).toFixed(0)}</strong>
              </div>
            </div>
          </div>
        ))}

        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 18px',
          display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontWeight: 700 }}>
          <span>Total Paid</span>
          <span style={{ color: '#2563eb', fontSize: 18 }}>₹{totalAmount.toFixed(0)}</span>
        </div>

        {/* Print Button */}
        <button onClick={handlePrint} style={{
          width: '100%', padding: 14, background: '#f8fafc', color: '#475569',
          border: '1.5px solid #e2e8f0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
          fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          🖨️ Print Ticket
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {onBookMore && (
            <button onClick={onBookMore} style={{
              flex: 1, padding: 14, background: '#f0fdf4', color: '#16a34a',
              border: '2px solid #86efac', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>+ Book More Seats<br/><span style={{fontSize:11,fontWeight:400}}>Same bus/trip</span></button>
          )}
          <button onClick={onDone} style={{
            flex: 1, padding: 14, background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15,
          }}>Book Another Ticket</button>
        </div>
      </div>
    </div>
  );
}

// ── Main BookingPage ─────────────────────────────────────────────
export default function BookingPage() {
  const [stage, setStage]         = useState('search');  // search | results | seats | confirmed
  const [results, setResults]     = useState([]);
  const [searchInfo, setSearchInfo] = useState({});
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [confirmedData, setConfirmedData]       = useState(null);
  const [confirmedSeats, setConfirmedSeats]     = useState([]);
  const [confirmedPassengers, setConfirmedPassengers] = useState([]);

  const handleResults = (data, info) => {
    setResults(data); setSearchInfo(info); setStage('results');
  };

  const handleSelect = (trip) => {
    setSelectedTrip(trip); setStage('seats');
  };

  const handleBooked = (data, trip, seats, passengers) => {
    setConfirmedData({ ...data, trip });
    setConfirmedSeats(seats);
    setConfirmedPassengers(passengers);
    setStage('confirmed');
  };

  const handleBookMore = () => {
    // Go back to seat layout for same trip — booked state already updated in SeatLayout
    setStage('seats');
    setConfirmedData(null); setConfirmedSeats([]); setConfirmedPassengers([]);
  };

  const reset = () => {
    setStage('search'); setResults([]); setSelectedTrip(null);
    setConfirmedData(null); setConfirmedSeats([]); setConfirmedPassengers([]);
  };

  return (
    <div style={{ padding: '32px 16px', minHeight: '80vh', background: '#f8fafc' }}>

      {/* Back navigation */}
      {stage !== 'search' && stage !== 'confirmed' && (
        <button onClick={() => setStage(stage === 'seats' ? 'results' : 'search')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb',
            fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'block' }}>
          ← Back
        </button>
      )}

      {stage === 'search'    && <SearchSection onResults={handleResults} />}
      {stage === 'results'   && <BusList results={results} searchInfo={searchInfo} onSelect={handleSelect} />}
      {stage === 'seats'     && <SeatLayout trip={selectedTrip} searchInfo={searchInfo} onSeatBooked={handleBooked} />}
      {stage === 'confirmed' && (
        <BookingConfirmed
          bookingData={confirmedData}
          trip={selectedTrip}
          seats={confirmedSeats}
          passengers={confirmedPassengers}
          onDone={reset}
          onBookMore={handleBookMore}
          searchInfo={searchInfo}
        />
      )}
    </div>
  );
}