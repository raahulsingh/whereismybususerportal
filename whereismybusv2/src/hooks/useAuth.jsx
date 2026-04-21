import { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';

/**
 * Persists the authenticated user across page refreshes via localStorage.
 * @returns {{ user: object|null, setUser: Function }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('bus_token');
    if (!token) return;

    fetch(getApiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && !d.error) setUser(d); })
      .catch(() => { });
  }, []);

  return { user, setUser };
}
