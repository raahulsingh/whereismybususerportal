import { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';
import { deduplicateStopsByName } from '../utils/tripUtils';

/**
 * Fetches and returns all bus stops on mount.
 * @returns {{ allStops: Array, loadingStops: boolean, error: string|null }}
 */
export function useStops() {
  const [allStops, setAllStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(getApiUrl('/api/stops'))
      .then(r => r.json())
      .then(d => {
        const raw = Array.isArray(d) ? d : [];
        setAllStops(deduplicateStopsByName(raw));
      })
      .catch(err => {
        console.error('Stops fetch error:', err);
        setError('Backend error: ' + (err.message || 'Connection failed'));
      })
      .finally(() => setLoadingStops(false));
  }, []);

  return { allStops, loadingStops, error };
}
