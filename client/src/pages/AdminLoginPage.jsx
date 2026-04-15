import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';
import { clearAdminToken, getAdminTokenState } from '../utils/adminAuth';
import { normalizeApiError, parseApiResponse } from '../utils/api';

const ADMIN_LOGIN_ERROR_OPTIONS = {
  fallback: 'Unable to verify admin access right now. Please try again.',
  unavailable: 'The frontend could not reach the backend API. Make sure the Express server is running on the configured API port.',
  invalidJson: 'The admin login endpoint did not return valid JSON. Make sure the backend is running and serving /api/auth/admin-login.',
  unauthorized: 'Your admin session expired. Please sign in again.',
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingToken = localStorage.getItem('token');
  const tokenState = useMemo(() => getAdminTokenState(existingToken), [existingToken]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.message || (existingToken && !tokenState.isValid ? tokenState.message : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingToken && !tokenState.isValid) {
      clearAdminToken();
    }
  }, [existingToken, tokenState.isValid]);

  if (tokenState.isValid) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await parseApiResponse(response, ADMIN_LOGIN_ERROR_OPTIONS);

      if (!data.token) {
        throw new Error('Admin authentication succeeded, but no token was returned.');
      }

      localStorage.setItem('token', data.token);
      navigate('/admin', { replace: true });
    } catch (submitError) {
      clearAdminToken();
      setError(normalizeApiError(submitError.message, ADMIN_LOGIN_ERROR_OPTIONS));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-glow admin-login-glow-left" />
      <div className="admin-login-glow admin-login-glow-right" />

      <main className="admin-login-layout">
        <section className="admin-login-intro">
          <p className="admin-login-eyebrow">Ko Japanese Dining</p>
          <h1>Admin access is protected behind a separate check.</h1>
          <p className="admin-login-copy">
            Use the temporary admin password to enter the operations dashboard and manage live order status updates.
          </p>
          <div className="admin-login-notes">
            <div className="admin-login-note">
              <span>Access flow</span>
              <strong>Menu page to admin sign-in to dashboard</strong>
            </div>
            <div className="admin-login-note">
              <span>Temporary password</span>
              <strong>Set to Admin1234 on the server for now</strong>
            </div>
          </div>
        </section>

        <section className="admin-login-card">
          <div className="admin-login-card-inner">
            <p className="admin-login-label">Admin Verification</p>
            <h2>Enter admin password</h2>
            <p className="admin-login-helper">
              This verifies admin access and routes you directly into the dashboard.
            </p>

            <form className="admin-login-form" onSubmit={handleSubmit}>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
              />

              {error ? <p className="admin-login-error">{error}</p> : null}

              <button type="submit" className="admin-login-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Checking access...' : 'Enter Dashboard'}
              </button>
            </form>

            <Link className="admin-login-back" to="/">
              Return to menu
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
