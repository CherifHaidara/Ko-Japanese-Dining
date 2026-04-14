import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder = 'Enter password', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-password-wrap">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      <button type="button" className="auth-eye-btn" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <EyeIcon visible={show} />
      </button>
    </div>
  );
}

export default function AuthPage({ defaultTab = 'login' }) {
  const [tab,     setTab]     = useState(defaultTab);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [loginForm,  setLoginForm]  = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm: '',
  });

  const setL = (field, val) => setLoginForm(p  => ({ ...p,  [field]: val }));
  const setS = (field, val) => setSignupForm(p => ({ ...p, [field]: val }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data.user, data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupForm.password !== signupForm.confirm) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          first_name: signupForm.first_name,
          last_name:  signupForm.last_name,
          email:      signupForm.email,
          password:   signupForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const loginRes  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: signupForm.email, password: signupForm.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        login(loginData.user, loginData.token);
        navigate('/profile');
      } else {
        setTab('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Link to="/" className="auth-back">← Back to Menu</Link>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login'  ? 'active' : ''}`}
            onClick={() => { setTab('login');  setError(''); }}>Log In</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}>Create Account</button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to your Ko account</p>

            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={loginForm.email}
                onChange={e => setL('email', e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <PasswordInput value={loginForm.password}
                onChange={e => setL('password', e.target.value)} required />
            </div>

            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub">Join Ko for a faster checkout experience</p>

            <div className="auth-row">
              <div className="auth-field">
                <label>First Name</label>
                <input type="text" placeholder="Jane" value={signupForm.first_name}
                  onChange={e => setS('first_name', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Last Name</label>
                <input type="text" placeholder="Smith" value={signupForm.last_name}
                  onChange={e => setS('last_name', e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={signupForm.email}
                onChange={e => setS('email', e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <PasswordInput value={signupForm.password}
                onChange={e => setS('password', e.target.value)} required />
              <ul className="auth-password-rules">
                <li className={signupForm.password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(signupForm.password) ? 'met' : ''}>One uppercase letter</li>
                <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(signupForm.password) ? 'met' : ''}>One special character</li>
              </ul>
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <PasswordInput value={signupForm.confirm}
                onChange={e => setS('confirm', e.target.value)} required />
            </div>

            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
