import React from 'react';
import BusItem from './BusItem';

function BusResults({ results, onSelectTrip }) {
  if (!results || results.length === 0) {
    return (
      <div className="status-msg" style={{ flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 28 }}>🔍</span>
        <span>No buses found for this route.</span>
      </div>
    );
  }

  return (
    <ul className="results-list" aria-label="Bus search results">
      {results.map(bus => (
        <BusItem
          key={bus.tripId}
          bus={bus}
          onClick={() => onSelectTrip?.(bus.tripId, bus.travelDate)}
        />
      ))}
    </ul>
  );
}

export default BusResults;