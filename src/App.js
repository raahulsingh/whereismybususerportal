import { useEffect, useState } from 'react';
import './App.css';
import BusResults from './components/BusResults';
import SearchForm from './components/SearchForm';
import TripDetails from './components/TripDetails';
import BookingPage from './components/BookingPage';
import AuthForm from './components/AuthForm';
import UserDashboard from './components/UserDashboard';
import { getApiUrl } from './apiConfig';

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
  const [menuOpen, setMenuOpen]                       = useState(false);


  useEffect(() => {
    fetch(getApiUrl('/api/stops'))
      .then(r => r.json())
      .then(d => { const raw = Array.isArray(d) ? d : []; setAllStops(deduplicateStopsByName(raw)); })
      .catch((err) => {
        console.error('Stops fetch error:', err);
        setError('Backend error: ' + (err.message || 'Connection failed'));
      })
      .finally(() => setLoadingStops(false));
      
    const token = localStorage.getItem('bus_token');
    if (token) {
      fetch(getApiUrl('/api/auth/me'), { headers: { 'Authorization': `Bearer ${token}` } })
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
      const res = await fetch(getApiUrl('/api/plan'), {
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
      const res  = await fetch(getApiUrl(`/api/trips/${tripId}/details`));
      const data = await res.json();
      setSelectedTripDetails({ ...data, tripId });
    } catch { setError('Trip details failed'); }
    finally { setLoadingTripDetails(false); }
  };

  const handleLogout = () => {
    fetch(getApiUrl('/api/auth/logout'), { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('bus_token')}` } });
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
        <div className="app-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo192.png" alt="Bus Logo" className="app-logo" style={{ height: 64, objectFit: 'contain', dropShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <span className="app-title" style={{ fontSize: '1.4rem', fontWeight: 800, marginLeft: 4 }}>Where is my <span style={{color: '#2563eb'}}>Bus</span></span>
          </div>
          
          {/* Hamburger Icon */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✖' : '☰'}
          </button>

          <nav className={`app-nav ${menuOpen ? 'open' : ''}`}>
            {[
              { key: 'home', label: 'Home' },
              { key: 'book', label: 'Book Ticket' },
              { key: 'support', label: 'Support' },
            ].map(({ key, label }) => (
              <button key={key}
                className={`nav-link${activePage === key ? ' nav-link--active' : ''}`}
                onClick={() => { setActivePage(key); setMenuOpen(false); }}>
                {label}
              </button>
            ))}
            <a href={getApiUrl('/api/app/download')} target="_blank" rel="noreferrer" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
              📥 Get App
            </a>
            {user ? (
              <>
                <button className={`nav-link${activePage === 'my-bookings' ? ' nav-link--active' : ''}`}
                        onClick={() => { setActivePage('my-bookings'); setMenuOpen(false); }}>
                  My Bookings
                </button>
                <div className="mobile-hide" style={{ width: 1, height: 24, background: '#cbd5e1', margin: '0 8px' }} />
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, padding: '10px 16px' }}>Hi, {user.name.split(' ')[0]}</div>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ margin: '0 16px', background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => { setShowAuth(true); setMenuOpen(false); }} style={{ margin: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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