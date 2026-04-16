import BusResults from './BusResults';
import SearchForm from './SearchForm';
import TripDetails from './TripDetails';

export default function HomeScreen({
  allStops,
  loadingStops,
  searchState,
  tripState,
  error,
  onSearch,
  onSelectTrip,
}) {
  const { results, searching, hasSearched, error: searchError } = searchState;
  const { details, travelDate, loading } = tripState;

  return (
    <div className="two-col">
      <div className="left-panel">
        {/* Search Form */}
        {loadingStops ? (
          <div className="status-msg">
            <span className="spinner" /> Loading stops…
          </div>
        ) : (
          <SearchForm allStops={allStops} onSearch={onSearch} />
        )}

        {/* Results Header */}
        {(hasSearched || searching) && (
          <div className="section-header" style={{ marginTop: 8 }}>
            Results
          </div>
        )}

        {/* Status Messages */}
        {searching && (
          <div className="status-msg">
            <span className="spinner" /> Searching…
          </div>
        )}
        {error && <div className="status-msg error">⚠ {error}</div>}

        {/* Bus Results */}
        {!searching && hasSearched && !error && <BusResults results={results} onSelectTrip={onSelectTrip} />}
      </div>

      <div className="right-panel">
        {/* Trip Details Loading */}
        {loading && (
          <div className="status-msg">
            <span className="spinner" /> Loading trip…
          </div>
        )}

        {/* Trip Details */}
        {details && <TripDetails details={details} travelDate={travelDate} />}
      </div>
    </div>
  );
}
