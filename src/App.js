import { useEffect, useState } from 'react';
import './App.css';
import BusResults from './components/BusResults';
import SearchForm from './components/SearchForm';
import TripDetails from './components/TripDetails';
import BookingPage from './components/BookingPage';
import AuthForm from './components/AuthForm';
import UserDashboard from './components/UserDashboard';

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
  const [user, setUser]                               = useState(null);
  const [showAuth, setShowAuth]                       = useState(false);


  useEffect(() => {
    fetch('/api/stops')
      .then(r => r.json())
      .then(d => { const raw = Array.isArray(d) ? d : []; setAllStops(deduplicateStopsByName(raw)); })
      .catch(() => setError('Backend error'))
      .finally(() => setLoadingStops(false));
      
    const token = localStorage.getItem('bus_token');
    if (token) {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && !d.error) setUser(d); })
        .catch(() => {});
    }
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

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('bus_token')}` } });
    localStorage.removeItem('bus_token');
    setUser(null);
    if(activePage === 'my-bookings' || activePage === 'book') setActivePage('home');
  };

  // ── AUTO LOGOUT ON INACTIVITY ──
  useEffect(() => {
    if (!user) return; // Only track when logged in

    let timeoutId;
    const INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        alert('You have been logged out due to 10 minutes of inactivity.');
      }, INACTIVITY_TIME);
    };

    // List of events representing user activity
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Start tracking immediately
    resetTimer();

    events.forEach(e => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user, activePage]); // include activePage so the closure inside handleLogout has the latest page info


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
            ].map(({ key, label }) => (
              <button key={key}
                className={`nav-link${activePage === key ? ' nav-link--active' : ''}`}
                onClick={() => setActivePage(key)}>
                {label}
              </button>
            ))}
            {user ? (
              <>
                <button className={`nav-link${activePage === 'my-bookings' ? ' nav-link--active' : ''}`}
                        onClick={() => setActivePage('my-bookings')}>
                  My Bookings
                </button>
                <div style={{ width: 1, height: 24, background: '#cbd5e1', margin: '0 8px' }} />
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Hi, {user.name.split(' ')[0]}</div>
                <button onClick={handleLogout} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginLeft: 10 }}>
                Login / Register
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">


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
        {activePage === 'book' && <BookingPage user={user} onRequestLogin={() => setShowAuth(true)} />}

        {/* ── MY BOOKINGS ── */}
        {activePage === 'my-bookings' && user && <UserDashboard />}

        {/* ── SUPPORT ── */}
        {activePage === 'support' && (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 40 }}>🆘</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Support</div>
            <div style={{ marginTop: 8 }}>Coming soon…</div>
          </div>
        )}

      </main>
      
      {/* ── AUTH MODAL ── */}
      {showAuth && (
        <AuthForm 
          onSuccess={(u) => { setUser(u); setShowAuth(false); }} 
          onCancel={() => setShowAuth(false)} 
        />
      )}
    </div>
  );
}

export default App;