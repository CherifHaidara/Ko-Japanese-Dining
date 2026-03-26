import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';

function parseTokenRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingToken = localStorage.getItem('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (existingToken && parseTokenRole(existingToken) === 'admin') {
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to verify admin access.');
      }

      localStorage.setItem('token', data.token);
      navigate('/admin', { replace: true });
    } catch (submitError) {
      localStorage.removeItem('token');
      setError(submitError.message);
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
