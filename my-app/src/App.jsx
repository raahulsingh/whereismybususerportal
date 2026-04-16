import { useCallback, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';

// Components
import AppHeader from './components/AppHeader';
import AuthForm from './components/AuthForm';
import BookingPage from './components/BookingPage';
import HomeScreen from './components/HomeScreen';
import SupportPage from './components/SupportPage';
import UserDashboard from './components/UserDashboard';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { useStops } from './hooks/useStops';

// Utils
import { getApiUrl } from './apiConfig';
import { calculateDuration } from './utils/tripUtils';

function App() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  // Search state (grouped)
  const [searchState, setSearchState] = useState({
    results: [],
    searching: false,
    hasSearched: false,
    error: null,
  });

  // Trip details state (grouped)
  const [tripState, setTripState] = useState({
    details: null,
    travelDate: null,
    loading: false,
  });

  // Custom hooks
  const { allStops, loadingStops, error: stopsError } = useStops();
  const { user, setUser } = useAuth();

  // Combined error (search or stops)
  const error = stopsError || searchState.error;

  // ── Handlers (memoized) ──

  const handleLogout = useCallback(() => {
    fetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('bus_token')}` },
    }).catch(() => {});
    localStorage.removeItem('bus_token');
    setUser(null);
    navigate('/');
  }, [setUser, navigate]);

  const handleSearch = useCallback(
    async ({ sourceId, destinationId, date }) => {
      setSearchState(prev => ({
        ...prev,
        searching: true,
        error: null,
        results: [],
        hasSearched: true,
      }));
      setTripState(prev => ({ ...prev, details: null }));

      const fromStop = allStops.find(s => String(s.id) === String(sourceId));
      const toStop = allStops.find(s => String(s.id) === String(destinationId));

      if (!fromStop || !toStop) {
        setSearchState(prev => ({ ...prev, error: 'Invalid stop selection.', searching: false }));
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/plan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromStopName: fromStop.name,
            toStopName: toStop.name,
            departureTime: date,
            date,
          }),
        });
        const data = await res.json();

        const routes = (data?.routeOptions || []).map(item => ({
          tripId: item.tripId,
          busName: item.busCode,
          departureTime: item.fromTime,
          arrivalTime: item.toTime,
          duration: calculateDuration(item.fromTime, item.toTime),
          sourceStop: item.sourceStop,
          destinationStop: item.destinationStop,
          travelDate: item.travelDate || date,
        }));

        setSearchState(prev => ({ ...prev, results: routes, searching: false }));
      } catch {
        setSearchState(prev => ({ ...prev, error: 'Search failed', searching: false }));
      }
    },
    [allStops]
  );

  const handleSelectTrip = useCallback(async (tripId, travelDate) => {
    setTripState(prev => ({ ...prev, loading: true, details: null }));

    try {
      const res = await fetch(getApiUrl(`/api/trips/${tripId}/details`));
      const data = await res.json();
      setTripState(prev => ({ ...prev, details: { ...data, tripId }, travelDate, loading: false }));
    } catch {
      setSearchState(prev => ({ ...prev, error: 'Trip details failed' }));
      setTripState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Auto-logout after inactivity
  useInactivityLogout(user, handleLogout);

  // ── Render ────────────────────────────────

  return (
    <div className="app-wrapper">
      <AppHeader user={user} onLogout={handleLogout} onShowAuth={() => setShowAuth(true)} />

      <main className="app-main">
        <Routes>
          {/* ── HOME ── */}
          <Route
            path="/"
            element={
              <HomeScreen
                allStops={allStops}
                loadingStops={loadingStops}
                searchState={searchState}
                tripState={tripState}
                error={error}
                onSearch={handleSearch}
                onSelectTrip={handleSelectTrip}
              />
            }
          />

          {/* ── BOOK TICKET ── */}
          <Route path="/book" element={<BookingPage user={user} onRequestLogin={() => setShowAuth(true)} />} />

          {/* ── MY BOOKINGS (protected) ── */}
          <Route
            path="/my-bookings"
            element={user ? <UserDashboard /> : <Navigate to="/" replace state={{ openAuth: true }} />}
          />

          {/* ── SUPPORT ── */}
          <Route path="/support" element={<SupportPage />} />

          {/* ── FALLBACK ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ── AUTH MODAL ── */}
      {showAuth && (
        <AuthForm
          onSuccess={u => {
            setUser(u);
            setShowAuth(false);
          }}
          onCancel={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

export default App;