import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PRIMARY_NAV_LINKS } from '../data/siteContent';

function getNavLinkClass({ isActive }) {
  return isActive ? 'nav-primary-link is-active' : 'nav-primary-link';
}

export default function Navbar({ locationPath, theme, toggleTheme, isReservationPage }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [locationPath]);

  return (
    <nav className={isReservationPage ? 'navbar navbar--reservation' : 'navbar'}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="Ko Japanese Dining home">
          <img
            src="/Ko_logo.png"
            alt="Ko Japanese Dining"
            className="navbar-logo"
          />
          <span className="navbar-name">Ko Japanese Dining</span>
        </Link>

        <button
          type="button"
          className={open ? 'navbar-menu-toggle is-open' : 'navbar-menu-toggle'}
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="primary-navigation"
          className={open ? 'navbar-actions is-open' : 'navbar-actions'}
        >
          <div className="navbar-primary-links">
            {PRIMARY_NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={getNavLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/account" className={getNavLinkClass}>
              My Reservations
            </NavLink>
            <NavLink to="/admin/login" className={getNavLinkClass}>
              Admin
            </NavLink>
          </div>

          <div className="navbar-secondary-actions">
            {user ? (
              <Link to="/profile" className="nav-profile-link">
                {user.profile_picture ? (
                  <img
                    src={`/uploads/${user.profile_picture}`}
                    alt=""
                    className="nav-profile-avatar nav-profile-avatar--img"
                  />
                ) : (
                  <span className="nav-profile-avatar">
                    {user.first_name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
                <span>{user.first_name}</span>
              </Link>
            ) : (
              <Link to="/login" className="nav-login-link">
                Sign In
              </Link>
            )}

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
