/**
 * Calculates human-readable duration between two ISO datetime strings.
 * @param {string} start
 * @param {string} end
 * @returns {string|null}
 */
export function calculateDuration(start, end) {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return null;
  const mins = Math.floor(Math.abs(e - s) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Removes duplicate stops that share the same normalised name.
 * @param {Array} stops
 * @returns {Array}
 */
export function deduplicateStopsByName(stops) {
  const seen = new Set();
  return stops.filter(s => {
    const key = s.name?.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
