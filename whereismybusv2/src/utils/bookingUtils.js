export function fmt(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(t) {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? t : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function duration(from, to) {
  if (!from || !to) return '';
  const m = Math.floor(Math.abs(new Date(to) - new Date(from)) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}