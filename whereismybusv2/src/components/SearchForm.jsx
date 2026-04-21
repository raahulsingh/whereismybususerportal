import React, { useState, useRef, useEffect } from 'react';

function StopSelector({ label, allStops, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);


  const selectedStop = allStops.find(s => String(s.id) === String(value));

  useEffect(() => {
    setQuery(selectedStop ? selectedStop.name : '');
  }, [value, allStops]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim() === ''
    ? allStops
    : allStops.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  const handleInput = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange('');
  };

  const handleSelect = (stop) => {
    setQuery(stop.name);
    onChange(String(stop.id));
    setOpen(false);
  };

  return (
    <div className="stop-field" ref={ref} style={{ position: 'relative' }}>
      <span className="stop-label">{label}</span>
      <input
        type="text"
        className="stop-search-input"
        placeholder="Type to search stop..."
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <ul className="stop-dropdown">
          {filtered.length === 0 ? (
            <li className="stop-dropdown-empty">No stops found</li>
          ) : (
            filtered.slice(0, 10).map(s => (
              <li
                key={s.id}
                className={`stop-dropdown-item${String(s.id) === String(value) ? ' selected' : ''}`}
                onMouseDown={() => handleSelect(s)}
              >
                {s.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function SearchForm({ allStops, onSearch }) {
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');

  // Date helpers — local date (not UTC) to handle IST +5:30 correctly
  const localDateStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  };
  const todayStr = () => localDateStr(0);
  const tomorrowStr = () => localDateStr(1);
  const yesterdayStr = () => localDateStr(-1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showCalendar, setShowCalendar] = useState(false);

  const fmtDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleSwap = () => {
    const tmp = sourceId;
    setSourceId(destinationId);
    setDestinationId(tmp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sourceId || !destinationId) {
      alert('Please select both a source and destination stop.');
      return;
    }
    if (sourceId === destinationId) {
      alert('Source and destination cannot be the same.');
      return;
    }
    onSearch({ sourceId, destinationId, date: selectedDate });
  };

  const today = todayStr();
  const tomorrow = tomorrowStr();
  const yesterday = yesterdayStr();
  const isToday = selectedDate === today;
  const isTomorrow = selectedDate === tomorrow;
  const isYesterday = selectedDate === yesterday;
  const isOther = !isToday && !isTomorrow && !isYesterday;

  const chipStyle = (active) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: active ? 700 : 500,
    border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#475569',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  });

  return (
    <div className="search-card">
      <div className="search-card-title">Plan your journey</div>
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          <StopSelector label="From" allStops={allStops} value={sourceId} onChange={setSourceId} />
          <div className="stop-divider">
            <button type="button" className="swap-btn" onClick={handleSwap} title="Swap">⇄</button>
          </div>
          <StopSelector label="To" allStops={allStops} value={destinationId} onChange={setDestinationId} />
        </div>

        {/* ── Date Selector ── */}
        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
            📅 Travel Date
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={chipStyle(isYesterday)}
              onClick={() => { setSelectedDate(yesterday); setShowCalendar(false); }}>
              Yesterday
            </button>
            <button type="button" style={chipStyle(isToday)}
              onClick={() => { setSelectedDate(today); setShowCalendar(false); }}>
              Today
            </button>
            <button type="button" style={chipStyle(isTomorrow)}
              onClick={() => { setSelectedDate(tomorrow); setShowCalendar(false); }}>
              Tomorrow
            </button>
            <div style={{ position: 'relative' }}>
              <button type="button"
                style={{ ...chipStyle(isOther), paddingRight: 10 }}
                onClick={() => setShowCalendar(v => !v)}>
                {isOther ? `📆 ${fmtDisplay(selectedDate)}` : '📆 Pick Date'}
              </button>
              {showCalendar && (
                <input
                  type="date"
                  autoFocus
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setShowCalendar(false); }}
                  onBlur={() => setShowCalendar(false)}
                  style={{
                    position: 'absolute', top: '110%', left: 0, zIndex: 100,
                    padding: '6px 10px', borderRadius: 8, border: '1.5px solid #2563eb',
                    fontSize: 14, background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                />
              )}
            </div>
            {isOther && (
              <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                {fmtDisplay(selectedDate)}
              </span>
            )}
          </div>
        </div>

        <button type="submit" className="search-btn" style={{ marginTop: 14 }}>Find Buses →</button>
      </form>
    </div>
  );
}

export default SearchForm;