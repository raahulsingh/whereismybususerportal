import { useEffect, useState } from 'react';
import './App.css';
import BusResults from './components/BusResults';
import SearchForm from './components/SearchForm';
import TripDetails from './components/TripDetails';
import AdminPanel from './components/AdminPanel';
import BookingPage from './components/BookingPage';
import BookingAdmin from './components/BookingAdmin';

function calculateDuration(start, end) {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return null;
  const mins = Math.floor(Math.abs(e - s) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function deduplicateStopsByName(stops) {
  const seen = new Set();
  return stops.filter(s => {
    const key = s.name?.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function App() {
  const [activePage, setActivePage]                   = useState('home');
  const [searchResults, setSearchResults]             = useState([]);
  const [allStops, setAllStops]                       = useState([]);
  const [error, setError]                             = useState(null);
  const [loadingStops, setLoadingStops]               = useState(true);
  const [searching, setSearching]                     = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [selectedTravelDate, setSelectedTravelDate]   = useState(null);
  const [loadingTripDetails, setLoadingTripDetails]   = useState(false);
  const [hasSearched, setHasSearched]                 = useState(false);
  const [adminMode, setAdminMode]                     = useState(null); // null | 'tracking' | 'booking'

  useEffect(() => {
    fetch('/api/stops')
      .then(r => r.json())
      .then(d => { const raw = Array.isArray(d) ? d : []; setAllStops(deduplicateStopsByName(raw)); })
      .catch(() => setError('Backend error'))
      .finally(() => setLoadingStops(false));
  }, []);

  const handleSearch = async ({ sourceId, destinationId, date }) => {
    setSearching(true); setError(null); setSearchResults([]); setSelectedTripDetails(null); setHasSearched(true);
    const fromStop = allStops.find(s => String(s.id) === String(sourceId));
    const toStop   = allStops.find(s => String(s.id) === String(destinationId));
    if (!fromStop || !toStop) { setError('Invalid stop selection.'); setSearching(false); return; }
    try {
      const res = await fetch('/api/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromStopName: fromStop.name, toStopName: toStop.name, departureTime: date, date }),
      });
      const data = await res.json();
      const routes = (data?.routeOptions || []).map(item => ({
        tripId: item.tripId, busName: item.busCode,
        departureTime: item.fromTime, arrivalTime: item.toTime,
        duration: calculateDuration(item.fromTime, item.toTime),
        sourceStop: item.sourceStop, destinationStop: item.destinationStop,
        travelDate: item.travelDate || date,
      }));
      setSearchResults(routes);
    } catch { setError('Search failed'); }
    finally { setSearching(false); }
  };

  const handleSelectTrip = async (tripId, travelDate) => {
    setLoadingTripDetails(true); setSelectedTripDetails(null);
    setSelectedTravelDate(travelDate || null);
    try {
      const res  = await fetch(`/api/trips/${tripId}/details`);
      const data = await res.json();
      setSelectedTripDetails({ ...data, tripId });
    } catch { setError('Trip details failed'); }
    finally { setLoadingTripDetails(false); }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="app-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="app-logo">🚌</span>
            <span className="app-title">Where is my <span>Bus</span></span>
          </div>
          <nav className="app-nav">
            {[
              { key: 'home', label: 'Home' },
              { key: 'book', label: 'Book Ticket' },
              { key: 'support', label: 'Supports' },
              { key: 'admin', label: 'Admin' },
            ].map(({ key, label }) => (
              <button key={key}
                className={`nav-link${activePage === key ? ' nav-link--active' : ''}`}
                onClick={() => { setActivePage(key); if (key === 'admin') setAdminMode(null); }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">

        {/* ── ADMIN ── */}
        {activePage === 'admin' && !adminMode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>🛠 Admin Panel</div>
            <div style={{ color: '#64748b' }}>Kaunsa admin panel kholna hai?</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => setAdminMode('tracking')} style={{
                padding: '20px 40px', background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)', textAlign: 'center', lineHeight: 1.8,
              }}>
                📡 Tracking Admin<br />
                <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>Routes · Buses · Trips · Bus State</span>
              </button>
              <button onClick={() => setAdminMode('booking')} style={{
                padding: '20px 40px', background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22,163,74,0.3)', textAlign: 'center', lineHeight: 1.8,
              }}>
                🎫 Booking Admin<br />
                <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>Bookings · Pricing · Password</span>
              </button>
            </div>
          </div>
        )}
        {activePage === 'admin' && adminMode === 'tracking' && (
          <>
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0.5rem 1.5rem' }}>
              <button onClick={() => setAdminMode(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Admin Home</button>
            </div>
            <AdminPanel />
          </>
        )}
        {activePage === 'admin' && adminMode === 'booking' && (
          <>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0.5rem 1.5rem' }}>
              <button onClick={() => setAdminMode(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Admin Home</button>
            </div>
            <BookingAdmin />
          </>
        )}

        {/* ── HOME ── */}
        {activePage === 'home' && (
          <div className="two-col">
            <div className="left-panel">
              {loadingStops ? (
                <div className="status-msg"><span className="spinner" /> Loading stops…</div>
              ) : (
                <SearchForm allStops={allStops} onSearch={handleSearch} />
              )}
              {(hasSearched || searching) && <div className="section-header" style={{ marginTop: 8 }}>Results</div>}
              {searching && <div className="status-msg"><span className="spinner" /> Searching…</div>}
              {error     && <div className="status-msg error">⚠ {error}</div>}
              {!searching && hasSearched && !error && <BusResults results={searchResults} onSelectTrip={handleSelectTrip} />}
            </div>
            <div className="right-panel">
              {loadingTripDetails && <div className="status-msg"><span className="spinner" /> Loading trip…</div>}
              {selectedTripDetails && <TripDetails details={selectedTripDetails} travelDate={selectedTravelDate} />}
            </div>
          </div>
        )}

        {/* ── BOOK TICKET ── */}
        {activePage === 'book' && <BookingPage />}

        {/* ── SUPPORT ── */}
        {activePage === 'support' && (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 40 }}>🆘</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Support</div>
            <div style={{ marginTop: 8 }}>Coming soon…</div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;