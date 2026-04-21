import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Components
import AppHeader     from './components/AppHeader';
import SearchForm    from './components/SearchForm';
import BusResults    from './components/BusResults';
import TripDetails   from './components/TripDetails';
import BookingPage   from './components/BookingPage';
import AuthForm      from './components/AuthForm';
import UserDashboard from './components/UserDashboard';
import SupportPage   from './components/SupportPage';

// Hooks
import { useAuth }             from './hooks/useAuth';
import { useStops }            from './hooks/useStops';
import { useInactivityLogout } from './hooks/useInactivityLogout';

// Utils
import { getApiUrl }         from './apiConfig';
import { calculateDuration } from './utils/tripUtils';

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  // Search state
  const [searchResults,    setSearchResults]    = useState([]);
  const [searching,        setSearching]        = useState(false);
  const [hasSearched,      setHasSearched]      = useState(false);
  const [searchError,      setSearchError]      = useState(null);

  // Trip detail state
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [selectedTravelDate,  setSelectedTravelDate]  = useState(null);
  const [loadingTripDetails,  setLoadingTripDetails]  = useState(false);

  // Custom hooks
  const { allStops, loadingStops, error: stopsError } = useStops();
  const { user, setUser } = useAuth();

  // Derived error
  const error = stopsError || searchError;

  // ── Handlers ──────────────────────────────

  const handleLogout = () => {
    fetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('bus_token')}` },
    });
    localStorage.removeItem('bus_token');
    setUser(null);
    navigate('/');
  };

  const handleSearch = async ({ sourceId, destinationId, date }) => {
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedTripDetails(null);
    setHasSearched(true);

    const fromStop = allStops.find(s => String(s.id) === String(sourceId));
    const toStop   = allStops.find(s => String(s.id) === String(destinationId));

    if (!fromStop || !toStop) {
      setSearchError('Invalid stop selection.');
      setSearching(false);
      return;
    }

    try {
      const res  = await fetch(getApiUrl('/api/plan'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fromStopName: fromStop.name, toStopName: toStop.name, departureTime: date, date }),
      });
      const data = await res.json();

      const routes = (data?.routeOptions || []).map(item => ({
        tripId:          item.tripId,
        busName:         item.busCode,
        departureTime:   item.fromTime,
        arrivalTime:     item.toTime,
        duration:        calculateDuration(item.fromTime, item.toTime),
        sourceStop:      item.sourceStop,
        destinationStop: item.destinationStop,
        travelDate:      item.travelDate || date,
      }));

      setSearchResults(routes);
    } catch {
      setSearchError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTrip = async (tripId, travelDate) => {
    setLoadingTripDetails(true);
    setSelectedTripDetails(null);
    setSelectedTravelDate(travelDate || null);

    try {
      const res  = await fetch(getApiUrl(`/api/trips/${tripId}/details`));
      const data = await res.json();
      setSelectedTripDetails({ ...data, tripId });
    } catch {
      setSearchError('Trip details failed');
    } finally {
      setLoadingTripDetails(false);
    }
  };

  // Auto-logout after inactivity (only while logged in)
  useInactivityLogout(user, handleLogout);

  // ── Render ────────────────────────────────

  return (
    <div className="app-wrapper">
      <AppHeader
        user={user}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
      />

      <main className="app-main">
        <Routes>
          {/* ── HOME ── */}
          <Route path="/" element={
            <div className="two-col">
              <div className="left-panel">
                {loadingStops ? (
                  <div className="status-msg"><span className="spinner" /> Loading stops…</div>
                ) : (
                  <SearchForm allStops={allStops} onSearch={handleSearch} />
                )}
                {(hasSearched || searching) && (
                  <div className="section-header" style={{ marginTop: 8 }}>Results</div>
                )}
                {searching  && <div className="status-msg"><span className="spinner" /> Searching…</div>}
                {error      && <div className="status-msg error">⚠ {error}</div>}
                {!searching && hasSearched && !error && (
                  <BusResults results={searchResults} onSelectTrip={handleSelectTrip} />
                )}
              </div>

              <div className="right-panel">
                {loadingTripDetails && (
                  <div className="status-msg"><span className="spinner" /> Loading trip…</div>
                )}
                {selectedTripDetails && (
                  <TripDetails details={selectedTripDetails} travelDate={selectedTravelDate} />
                )}
              </div>
            </div>
          } />

          {/* ── BOOK TICKET ── */}
          <Route path="/book/*" element={
            <BookingPage user={user} onRequestLogin={() => setShowAuth(true)} />
          } />

          {/* ── MY BOOKINGS (protected) ── */}
          <Route path="/my-bookings" element={
            user
              ? <UserDashboard />
              : <Navigate to="/" replace state={{ openAuth: true }} />
          } />

          {/* ── SUPPORT ── */}
          <Route path="/support" element={<SupportPage />} />

          {/* ── FALLBACK ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
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