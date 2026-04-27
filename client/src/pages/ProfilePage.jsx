import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import './ProfilePage.css';

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
    <div className="profile-password-wrap">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      <button type="button" className="profile-eye-btn" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <EyeIcon visible={show} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate  = useNavigate();
  const fileInput = useRef(null);

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploadingPic,  setUploadingPic]  = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [form, setForm] = useState({
    first_name:       '',
    last_name:        '',
    email:            '',
    dietary_notes:    '',
    current_password: '',
    new_password:     '',
    confirm_password: '',
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    authFetch('/api/users/me')
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm(f => ({
          ...f,
          first_name:    data.first_name    || '',
          last_name:     data.last_name     || '',
          email:         data.email         || '',
          dietary_notes: data.dietary_notes || '',
        }));
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));

    authFetch('/api/users/me/orders')
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPic(true);
    setError('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res  = await authFetch('/api/users/me/avatar', {
        method:  'POST',
        headers: {},   // let browser set multipart boundary
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updatedUser = { ...user, profile_picture: data.profile_picture };
      updateUser(updatedUser);
      setProfile(p => ({ ...p, profile_picture: data.profile_picture }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password && form.new_password !== form.confirm_password) {
      return setError('New passwords do not match.');
    }

    setSaving(true);
    try {
      const body = {
        first_name:    form.first_name,
        last_name:     form.last_name,
        email:         form.email,
        dietary_notes: form.dietary_notes,
      };
      if (form.new_password) {
        body.current_password = form.current_password;
        body.new_password     = form.new_password;
      }

      const res  = await authFetch('/api/users/me', {
        method: 'PATCH',
        body:   JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      updateUser({ ...user, ...data.user });
      setSuccess('Profile updated successfully.');
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const avatarSrc = profile?.profile_picture
    ? `/uploads/${profile.profile_picture}`
    : null;

  if (loading) {
    return <div className="profile-shell"><p className="profile-loading">Loading…</p></div>;
  }

  return (
    <div className="profile-shell">
      <Link to="/" className="profile-back">← Back to Home</Link>

      <div className="profile-header">
        {/* Avatar — click to upload */}
        <div className="profile-avatar-wrap" onClick={() => fileInput.current.click()}
          title="Click to change photo">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {form.first_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="profile-avatar-overlay">
            {uploadingPic ? (
              <span style={{ fontSize: 13 }}>…</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <h1 className="profile-name">{form.first_name} {form.last_name}</h1>
          <p className="profile-email-display">{form.email}</p>
          {profile?.created_at && (
            <p className="profile-since">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSave}>

        <div className="profile-section">
          <p className="profile-section-title">Personal Information</p>
          <div className="profile-row">
            <div className="profile-field">
              <label>First Name</label>
              <input type="text" value={form.first_name}
                onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div className="profile-field">
              <label>Last Name</label>
              <input type="text" value={form.last_name}
                onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="profile-field">
            <label>Dietary Notes <span className="profile-optional">(optional)</span></label>
            <textarea placeholder="Allergies, dietary restrictions, or preferences…"
              value={form.dietary_notes} onChange={e => set('dietary_notes', e.target.value)} />
          </div>
        </div>

        <div className="profile-section">
          <p className="profile-section-title">Change Password <span className="profile-optional">— leave blank to keep current</span></p>
          <div className="profile-field">
            <label>Current Password</label>
            <PasswordInput value={form.current_password}
              onChange={e => set('current_password', e.target.value)} />
          </div>
          <div className="profile-row">
            <div className="profile-field">
              <label>New Password</label>
              <PasswordInput value={form.new_password}
                onChange={e => set('new_password', e.target.value)} />
            </div>
            <div className="profile-field">
              <label>Confirm New Password</label>
              <PasswordInput value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} />
            </div>
          </div>
        </div>

        {error   && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}

        <div className="profile-actions">
          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" className="profile-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>

      </form>

      {/* ── Order History ── */}
      <div className="profile-orders">
        <p className="profile-section-title" style={{ marginBottom: 16 }}>Order History</p>

        {ordersLoading ? (
          <p className="profile-orders-empty">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="profile-orders-empty">No orders yet.</p>
        ) : (
          orders.map(order => (
            <div key={order.order_id} className="profile-order-card">
              <div className="profile-order-header">
                <div>
                  <p className="profile-order-num">Order #{order.order_id}</p>
                  <p className="profile-order-date">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="profile-order-right">
                  <span className={`profile-order-status profile-order-status--${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="profile-order-total">${parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
              <div className="profile-order-items">
                {order.items.map((item, i) => (
                  <p key={i} className="profile-order-item">
                    {item.item_name} × {item.quantity}
                    <span>${(parseFloat(item.item_price) * item.quantity).toFixed(2)}</span>
                  </p>
                ))}
              </div>
              <Link to={`/order/${order.order_id}`} className="profile-order-track">
                Track order →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
