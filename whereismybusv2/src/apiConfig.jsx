//const BASE_URL = 'http://localhost:8080';
 const BASE_URL = 'https://where-is-my-bus-backend-ox7r.onrender.com';

export const getApiUrl = (path) => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Capacitor/Android needs absolute URLs
  return `${BASE_URL}${cleanPath}`;
};
