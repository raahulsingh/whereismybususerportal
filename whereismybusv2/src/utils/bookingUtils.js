export function fmt(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function fmtDate(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function duration(from, to) {
  if (!from || !to) return '';
  const d1 = new Date(from);
  let d2 = new Date(to);
  
  // If destination time is earlier than start time, it's an overnight trip
  if (d2 < d1) {
    d2.setDate(d2.getDate() + 1);
  }
  
  const m = Math.floor((d2 - d1) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}