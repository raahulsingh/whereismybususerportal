import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../apiConfig';
import icon from '../assets/icon.png';

const NAV_LINKS = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'book', label: 'Book Ticket', path: '/book' },
  { key: 'support', label: 'Support', path: '/support' },
];

export default function AppHeader({ user, onLogout, onShowAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-header">
      <div
        className="app-header-inner"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={icon}
            alt="Bus Logo"
            className="app-logo"
            style={{ height: 64, objectFit: 'contain' }}
          />
          <span className="app-title" style={{ fontSize: '1.4rem', fontWeight: 800, marginLeft: 4 }}>
            Where is my <span style={{ color: '#2563eb' }}>Bus</span>
          </span>
        </div>

        {/* Hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(prev => !prev)}>
          {menuOpen ? '✖' : '☰'}
        </button>

        {/* Nav */}
        <nav className={`app-nav ${menuOpen ? 'open' : ''}`}>
          {NAV_LINKS.map(({ key, label, path }) => (
            <button
              key={key}
              className={`nav-link${isActive(path) ? ' nav-link--active' : ''}`}
              onClick={() => handleNavigate(path)}
            >
              {label}
            </button>
          ))}

          <a
            href={getApiUrl('/api/app/download')}
            target="_blank"
            rel="noreferrer"
            className="nav-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}
          >
            📥 Get App
          </a>

          {user ? (
            <>
              <button
                className={`nav-link${isActive('/my-bookings') ? ' nav-link--active' : ''}`}
                onClick={() => handleNavigate('/my-bookings')}
              >
                My Bookings
              </button>
              <div className="mobile-hide" style={{ width: 1, height: 24, background: '#cbd5e1', margin: '0 8px' }} />
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, padding: '10px 16px' }}>
                Hi, {user.name.split(' ')[0]}
              </div>
              <button
                onClick={() => { onLogout(); setMenuOpen(false); }}
                style={{ margin: '0 16px', background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { onShowAuth(); setMenuOpen(false); }}
              style={{ margin: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Login / Register
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
