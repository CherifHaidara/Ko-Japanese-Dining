import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';
import { clearAdminToken } from '../utils/adminAuth';
import { normalizeApiError, parseApiResponse } from '../utils/api';

const TODAY = new Date().toISOString().slice(0, 10);
const THIRTY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
})();

const ORDER_STATUS_COLUMNS = ['pending', 'confirmed', 'preparing', 'ready'];
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled'];
const RESERVATION_TYPES = ['standard', 'kaiseki', 'omakase', 'prix-fixe', 'private-event'];

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#60a5fa',
  preparing: '#fb923c',
  ready: '#4ade80',
  completed: '#9ca3af',
  cancelled: '#f87171'
};

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed'
};

function getToken() {
  return localStorage.getItem('token');
}

function parseItems(items) {
  return Array.isArray(items) ? items : [];
}

function formatReservationType(type) {
  return String(type || '')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatReservationTime(time) {
  const [hours = '00', minutes = '00'] = String(time || '').split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function buildAdminTimeSlots(dateString) {
  const slots = [];
  const selectedDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();

  for (let hour = 17; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute > 0) continue;
      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, minute, 0, 0);
      slots.push({
        value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
        label: slotDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      });
    }
  }

  return slots;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [updatingReservation, setUpdatingReservation] = useState(false);
  const [reservationFilters, setReservationFilters] = useState({ date: '', status: '' });
  const [reservationForm, setReservationForm] = useState({
    date: '', time: '', partySize: '2', status: 'pending', type: 'standard'
  });

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [dateStart, setDateStart] = useState(THIRTY_DAYS_AGO);
  const [dateEnd, setDateEnd] = useState(TODAY);

  const redirectToAdminLogin = useCallback((message = 'Your admin session expired. Please sign in again.') => {
    clearAdminToken();
    navigate('/admin/login', { replace: true, state: { message } });
  }, [navigate]);

  const normalizeDashboardError = useCallback((message, fallback) => normalizeApiError(message, {
    fallback,
    unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
    invalidJson: 'The backend returned an invalid response while loading admin data.',
    unauthorized: 'Your admin session expired. Please sign in again.'
  }), []);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to load orders.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON while loading orders.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      setOrdersError(normalizeDashboardError(err.message, 'Could not load orders right now.'));
    } finally {
      setOrdersLoading(false);
    }
  }, [normalizeDashboardError, redirectToAdminLogin]);

  const fetchReservations = useCallback(async (filters = reservationFilters) => {
    try {
      setReservationsLoading(true);
      setReservationsError(null);
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.status) params.set('status', filters.status);
      const query = params.toString();
      const res = await fetch(query ? `/api/reservations/admin?${query}` : '/api/reservations/admin', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to load reservations.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON while loading reservations.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      setReservationsError(normalizeDashboardError(err.message, 'Could not load reservations right now.'));
    } finally {
      setReservationsLoading(false);
    }
  }, [normalizeDashboardError, redirectToAdminLogin, reservationFilters]);

  const fetchAnalytics = useCallback(async (start, end) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const res = await fetch(`/api/admin/analytics?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to load analytics.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON while loading analytics.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setAnalytics(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      setAnalyticsError(normalizeDashboardError(err.message, 'Could not load analytics right now.'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [normalizeDashboardError, redirectToAdminLogin]);

  useEffect(() => {
    fetchOrders();
    fetchReservations(reservationFilters);
    const interval = setInterval(() => {
      fetchOrders();
      fetchReservations(reservationFilters);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchReservations, reservationFilters]);

  useEffect(() => {
    if (activeView === 'analytics' && !analytics && !analyticsLoading) {
      fetchAnalytics(dateStart, dateEnd);
    }
  }, [activeView, analytics, analyticsLoading, dateStart, dateEnd, fetchAnalytics]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus })
      });
      await parseApiResponse(res, {
        fallback: 'Update failed.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON while updating an order.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      alert(`Error: ${normalizeDashboardError(err.message, 'The order could not be updated right now.')}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleReservationFilterChange = (field, value) => {
    setReservationFilters(prev => ({ ...prev, [field]: value }));
  };

  const openReservationModal = (reservation) => {
    setSelectedReservation(reservation);
    setReservationForm({
      date: reservation.date,
      time: reservation.time,
      partySize: String(reservation.party_size),
      status: reservation.status,
      type: reservation.type
    });
  };

  const handleReservationDateChange = (value) => {
    const nextSlots = buildAdminTimeSlots(value);
    setReservationForm(prev => ({
      ...prev,
      date: value,
      time: nextSlots.find(s => s.value === prev.time)?.value || nextSlots[0]?.value || ''
    }));
  };

  const handleSaveReservation = async () => {
    if (!selectedReservation) return;
    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${selectedReservation.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          date: reservationForm.date,
          time: reservationForm.time,
          party_size: Number(reservationForm.partySize),
          status: reservationForm.status,
          type: reservationForm.type
        })
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to update reservation.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setSelectedReservation(data.reservation);
      setReservations(prev => prev.map(r => r.id === data.reservation.id ? data.reservation : r));
      await fetchReservations();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      alert(`Error: ${normalizeDashboardError(err.message, 'The reservation could not be updated right now.')}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const confirmReservation = async (reservation) => {
    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          date: reservation.date, time: reservation.time,
          party_size: reservation.party_size, status: 'confirmed', type: reservation.type
        })
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to confirm reservation.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setReservations(prev => prev.map(r => r.id === data.reservation.id ? data.reservation : r));
      if (selectedReservation?.id === data.reservation.id) setSelectedReservation(data.reservation);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      alert(`Error: ${normalizeDashboardError(err.message, 'The reservation could not be confirmed right now.')}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const cancelReservation = async (reservation) => {
    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          date: reservation.date, time: reservation.time,
          party_size: reservation.party_size, status: 'cancelled', type: reservation.type
        })
      });
      const data = await parseApiResponse(res, {
        fallback: 'Failed to cancel reservation.',
        unavailable: 'The dashboard could not reach the backend API.',
        invalidJson: 'The backend returned invalid JSON.',
        unauthorized: 'Your admin session expired. Please sign in again.'
      });
      setReservations(prev => prev.map(r => r.id === data.reservation.id ? data.reservation : r));
      if (selectedReservation?.id === data.reservation.id) setSelectedReservation(data.reservation);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message, 'Your admin session expired.'));
        return;
      }
      alert(`Error: ${normalizeDashboardError(err.message, 'The reservation could not be cancelled right now.')}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const ordersByStatus = status => orders.filter(o => o.status === status);

  const renderOrdersView = () => {
    if (ordersLoading) return <div className="ad-loading">Loading orders...</div>;
    if (ordersError) return <div className="ad-error">{ordersError}</div>;

    return (
      <div className="ad-board">
        {ORDER_STATUS_COLUMNS.map(status => (
          <div key={status} className="ad-column">
            <div className={`ad-column-header ad-col-${status}`}>
              <span>{STATUS_LABELS[status]}</span>
              <span className="ad-col-count">{ordersByStatus(status).length}</span>
            </div>
            <div className="ad-column-body">
              {ordersByStatus(status).length === 0 && (
                <p className="ad-empty">No orders</p>
              )}
              {ordersByStatus(status).map(order => (
                <button key={order.order_id} className="ad-order-card" onClick={() => setSelectedOrder(order)}>
                  <div className="ad-card-top">
                    <span className="ad-order-id">#{order.order_id}</span>
                    <span className="ad-order-total">${Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="ad-card-name">{order.customer_name}</div>
                  <div className="ad-card-items">
                    {parseItems(order.items).map((item, i) => (
                      <span key={i} className="ad-item-pill">{item.item_name}</span>
                    ))}
                  </div>
                  <div className="ad-card-time">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReservationsView = () => {
    if (reservationsLoading) return <div className="ad-loading">Loading reservations...</div>;
    if (reservationsError) return <div className="ad-error">{reservationsError}</div>;

    return (
      <>
        <div className="ad-res-toolbar">
          <div className="ad-res-filters">
            <label className="ad-res-filter">
              <span>Date</span>
              <input type="date" value={reservationFilters.date} onChange={e => handleReservationFilterChange('date', e.target.value)} />
            </label>
            <label className="ad-res-filter">
              <span>Status</span>
              <select value={reservationFilters.status} onChange={e => handleReservationFilterChange('status', e.target.value)}>
                <option value="">All statuses</option>
                {RESERVATION_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="ad-header-right">
            <span className="ad-order-count">{reservations.length} reservations</span>
            <button className="ad-refresh-btn" onClick={() => fetchReservations()}>Refresh</button>
          </div>
        </div>

        <div className="ad-res-list">
          {reservations.length === 0 ? (
            <div className="ad-empty-card">No reservations match the selected filters.</div>
          ) : reservations.map(reservation => (
            <article key={reservation.id} className="ad-res-card">
              <div className="ad-res-card-top">
                <div>
                  <p className="ad-modal-label">Confirmation</p>
                  <h3>{reservation.confirmation_number}</h3>
                </div>
                <span className={`ad-status-badge ad-col-${reservation.status}`}>
                  {STATUS_LABELS[reservation.status]}
                </span>
              </div>
              <div className="ad-res-grid">
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Guest</span>
                  <span className="ad-detail-value">{reservation.customer_name}</span>
                </div>
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Email</span>
                  <span className="ad-detail-value">{reservation.customer_email}</span>
                </div>
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Date</span>
                  <span className="ad-detail-value">{new Date(`${reservation.date}T12:00:00`).toLocaleDateString()}</span>
                </div>
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Time</span>
                  <span className="ad-detail-value">{formatReservationTime(reservation.time)}</span>
                </div>
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Party Size</span>
                  <span className="ad-detail-value">{reservation.party_size} guests</span>
                </div>
                <div className="ad-detail-block">
                  <span className="ad-detail-label">Type</span>
                  <span className="ad-detail-value">{formatReservationType(reservation.type)}</span>
                </div>
              </div>
              <div className="ad-res-actions">
                <button className="ad-status-btn" onClick={() => openReservationModal(reservation)}>Modify</button>
                <button
                  className="ad-status-btn is-current"
                  disabled={updatingReservation || reservation.status === 'confirmed' || reservation.status === 'cancelled'}
                  onClick={() => confirmReservation(reservation)}
                >
                  Confirm
                </button>
                <button
                  className="ad-status-btn ad-status-btn-danger"
                  disabled={updatingReservation || reservation.status === 'cancelled'}
                  onClick={() => cancelReservation(reservation)}
                >
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  };

  const renderAnalyticsView = () => (
    <div className="ad-analytics">
      <div className="an-date-bar">
        <label className="an-date-label">
          From
          <input type="date" className="an-date-input" value={dateStart} max={dateEnd} onChange={e => setDateStart(e.target.value)} />
        </label>
        <label className="an-date-label">
          To
          <input type="date" className="an-date-input" value={dateEnd} min={dateStart} max={TODAY} onChange={e => setDateEnd(e.target.value)} />
        </label>
        <button className="ad-refresh-btn" onClick={() => fetchAnalytics(dateStart, dateEnd)} disabled={analyticsLoading}>
          {analyticsLoading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      {analyticsError && <div className="ad-error">{analyticsError}</div>}

      {analytics && !analyticsLoading && (
        <>
          <div className="an-stat-grid">
            <div className="an-stat-card">
              <span className="an-stat-label">Total Orders</span>
              <span className="an-stat-value">{analytics.totals.total_orders}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">Total Revenue</span>
              <span className="an-stat-value">${analytics.totals.total_revenue.toFixed(2)}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">Avg Order Value</span>
              <span className="an-stat-value">${analytics.totals.avg_order_value.toFixed(2)}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">Completed Revenue</span>
              <span className="an-stat-value an-stat-green">${analytics.totals.completed_revenue.toFixed(2)}</span>
            </div>
          </div>

          <div className="an-section">
            <h3 className="an-section-title">Orders by Status</h3>
            <div className="an-status-grid">
              {ORDER_STATUSES.map(status => {
                const entry = analytics.orders_by_status.find(row => row.status === status);
                return (
                  <div key={status} className="an-status-card" style={{ borderLeftColor: STATUS_COLORS[status] }}>
                    <span className="an-status-name" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                    <span className="an-status-count">{entry ? entry.count : 0}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="an-section">
            <h3 className="an-section-title">Order Volume by Day</h3>
            {analytics.orders_by_day.length === 0 ? (
              <p className="ad-empty">No order data for this range.</p>
            ) : (
              <div className="an-chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.orders_by_day} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2c32" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 12 }}
                      tickFormatter={date => { const [,m,d] = date.split('-'); return `${m}/${d}`; }}
                      axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#4b5563', fontSize: 12 }}
                      axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      cursor={{ fill: 'rgba(187,34,51,0.07)' }}
                      contentStyle={{ background: '#17171b', border: '1px solid #2c2c32', borderRadius: '8px', fontSize: '13px' }}
                      labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                      itemStyle={{ color: '#fca5a5' }}
                      formatter={v => [v, 'Orders']}
                    />
                    <Bar dataKey="order_count" fill="#bb2233" radius={[4,4,0,0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="an-section">
            <h3 className="an-section-title">Top Items</h3>
            {analytics.top_items.length === 0 ? (
              <p className="ad-empty">No item data for this range.</p>
            ) : (
              <table className="an-table">
                <thead>
                  <tr><th>#</th><th>Item</th><th>Qty Sold</th><th>Orders</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {analytics.top_items.map((item, i) => (
                    <tr key={i}>
                      <td className="an-rank">{i + 1}</td>
                      <td className="an-item-name">{item.item_name}</td>
                      <td>{item.total_quantity}</td>
                      <td>{item.order_count}</td>
                      <td>${item.total_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {analyticsLoading && <div className="ad-loading">Loading analytics...</div>}
    </div>
  );

  return (
    <div className="ad-shell">
      <header className="ad-header">
        <div className="ad-header-left">
          <span className="ad-brand">Ko Japanese Dining</span>
          <span className="ad-title">Admin Dashboard</span>
        </div>
        <div className="ad-view-switch">
          <button className={activeView === 'orders' ? 'ad-view-tab is-active' : 'ad-view-tab'} onClick={() => setActiveView('orders')}>
            Orders
          </button>
          <button className={activeView === 'reservations' ? 'ad-view-tab is-active' : 'ad-view-tab'} onClick={() => setActiveView('reservations')}>
            Reservations
          </button>
          <button className={activeView === 'analytics' ? 'ad-view-tab is-active' : 'ad-view-tab'} onClick={() => setActiveView('analytics')}>
            Analytics
          </button>
        </div>
        <div className="ad-header-right">
          {activeView === 'orders' && (
            <>
              <span className="ad-order-count">{orders.length} orders</span>
              <button className="ad-refresh-btn" onClick={fetchOrders} disabled={ordersLoading}>Refresh</button>
            </>
          )}
          <Link to="/" className="ad-back-link">← Back to Home</Link>
          <button className="ad-refresh-btn" onClick={() => redirectToAdminLogin('You have been signed out.')}>
            Sign Out
          </button>
        </div>
      </header>

      {activeView === 'orders' && renderOrdersView()}
      {activeView === 'reservations' && renderReservationsView()}
      {activeView === 'analytics' && renderAnalyticsView()}

      {selectedOrder && (
        <div className="ad-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <button className="ad-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            <div className="ad-modal-header">
              <div>
                <p className="ad-modal-label">Order Details</p>
                <h2 className="ad-modal-title">Order #{selectedOrder.order_id}</h2>
              </div>
              <span className={`ad-status-badge ad-col-${selectedOrder.status}`}>{STATUS_LABELS[selectedOrder.status]}</span>
            </div>
            <div className="ad-modal-grid">
              <div className="ad-detail-block">
                <span className="ad-detail-label">Customer</span>
                <span className="ad-detail-value">{selectedOrder.customer_name}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Email</span>
                <span className="ad-detail-value">{selectedOrder.customer_email || '-'}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Total</span>
                <span className="ad-detail-value">${Number(selectedOrder.total).toFixed(2)}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Placed At</span>
                <span className="ad-detail-value">{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="ad-items-section">
              <h4>Items Ordered</h4>
              <ul className="ad-items-list">
                {parseItems(selectedOrder.items).map((item, i) => (
                  <li key={i} className="ad-item-row">
                    <span>{item.item_name}</span>
                    <span>${Number(item.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {selectedOrder.notes && (
              <div className="ad-notes">
                <h4>Notes</h4>
                <p>{selectedOrder.notes}</p>
              </div>
            )}
            <div className="ad-status-controls">
              <h4>Update Status</h4>
              <div className="ad-status-buttons">
                {ORDER_STATUSES.map(status => (
                  <button
                    key={status}
                    className={`ad-status-btn ${selectedOrder.status === status ? 'is-current' : ''}`}
                    disabled={
                      selectedOrder.status === status ||
                      updatingOrder === selectedOrder.order_id ||
                      selectedOrder.status === 'completed' ||
                      selectedOrder.status === 'cancelled'
                    }
                    onClick={() => updateOrderStatus(selectedOrder.order_id, status)}
                  >
                    {updatingOrder === selectedOrder.order_id && status === NEXT_STATUS[selectedOrder.status]
                      ? 'Updating...' : STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
              {NEXT_STATUS[selectedOrder.status] && (
                <button
                  className="ad-advance-btn"
                  disabled={updatingOrder === selectedOrder.order_id}
                  onClick={() => updateOrderStatus(selectedOrder.order_id, NEXT_STATUS[selectedOrder.status])}
                >
                  {updatingOrder === selectedOrder.order_id
                    ? 'Updating...'
                    : `Move to ${STATUS_LABELS[NEXT_STATUS[selectedOrder.status]]}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReservation && (
        <div className="ad-overlay" onClick={() => setSelectedReservation(null)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <button className="ad-modal-close" onClick={() => setSelectedReservation(null)}>×</button>
            <div className="ad-modal-header">
              <div>
                <p className="ad-modal-label">Reservation Details</p>
                <h2 className="ad-modal-title">{selectedReservation.confirmation_number}</h2>
              </div>
              <span className={`ad-status-badge ad-col-${selectedReservation.status}`}>{STATUS_LABELS[selectedReservation.status]}</span>
            </div>
            <div className="ad-modal-grid">
              <div className="ad-detail-block">
                <span className="ad-detail-label">Guest</span>
                <span className="ad-detail-value">{selectedReservation.customer_name}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Phone</span>
                <span className="ad-detail-value">{selectedReservation.customer_phone}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Email</span>
                <span className="ad-detail-value">{selectedReservation.customer_email}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Created At</span>
                <span className="ad-detail-value">{new Date(selectedReservation.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="ad-res-edit-grid">
              <label className="ad-res-edit-field">
                <span>Date</span>
                <input type="date" value={reservationForm.date} onChange={e => handleReservationDateChange(e.target.value)} />
              </label>
              <label className="ad-res-edit-field">
                <span>Time</span>
                <select value={reservationForm.time} onChange={e => setReservationForm(prev => ({ ...prev, time: e.target.value }))}>
                  {buildAdminTimeSlots(reservationForm.date).map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Party Size</span>
                <select value={reservationForm.partySize} onChange={e => setReservationForm(prev => ({ ...prev, partySize: e.target.value }))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(size => (
                    <option key={size} value={size}>{size} {size === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Type</span>
                <select value={reservationForm.type} onChange={e => setReservationForm(prev => ({ ...prev, type: e.target.value }))}>
                  {RESERVATION_TYPES.map(type => (
                    <option key={type} value={type}>{formatReservationType(type)}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Status</span>
                <select value={reservationForm.status} onChange={e => setReservationForm(prev => ({ ...prev, status: e.target.value }))}>
                  {RESERVATION_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
            </div>
            {selectedReservation.dietary_restrictions && (
              <div className="ad-notes">
                <h4>Dietary Restrictions</h4>
                <p>{selectedReservation.dietary_restrictions}</p>
              </div>
            )}
            {selectedReservation.event_notes && (
              <div className="ad-notes">
                <h4>Event Notes</h4>
                <p>{selectedReservation.event_notes}</p>
              </div>
            )}
            <div className="ad-status-controls">
              <h4>Reservation Actions</h4>
              <div className="ad-status-buttons">
                <button className="ad-status-btn is-current" disabled={updatingReservation} onClick={handleSaveReservation}>
                  {updatingReservation ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="ad-status-btn"
                  disabled={updatingReservation || selectedReservation.status === 'confirmed' || reservationForm.status === 'cancelled'}
                  onClick={() => confirmReservation(selectedReservation)}
                >
                  Confirm
                </button>
                <button
                  className="ad-status-btn ad-status-btn-danger"
                  disabled={updatingReservation || selectedReservation.status === 'cancelled'}
                  onClick={() => cancelReservation(selectedReservation)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
