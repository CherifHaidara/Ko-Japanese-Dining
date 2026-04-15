import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { clearAdminToken } from '../utils/adminAuth';
import { normalizeApiError, parseApiResponse } from '../utils/api';

const ORDER_STATUS_COLUMNS = ["pending", "confirmed", "preparing", "ready"];
const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled"];
const RESERVATION_TYPES = ["standard", "kaiseki", "omakase", "prix-fixe", "private-event"];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled"
};

const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed"
};

function getToken() {
  return localStorage.getItem('token');
}

function formatReservationType(type) {
  return String(type || "")
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatReservationTime(time) {
  const [hours = "00", minutes = "00"] = String(time || "").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
        value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        label: slotDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
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
    date: "",
    time: "",
    partySize: "2",
    status: "pending",
    type: 'standard'
  });

  const redirectToAdminLogin = useCallback((message = 'Your admin session expired. Please sign in again.') => {
    clearAdminToken();
    navigate('/admin/login', { replace: true, state: { message } });
  }, [navigate]);

  const normalizeDashboardError = useCallback((message) => normalizeApiError(message, {
    fallback: 'The admin dashboard could not load data right now.',
    unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
    invalidJson: 'The backend returned an invalid response while loading admin data.',
    unauthorized: 'Your admin session expired. Please sign in again.',
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
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while loading orders.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });
      setOrders(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      setOrdersError(normalizeDashboardError(err.message));
    } finally {
      setOrdersLoading(false);
    }
  }, [normalizeDashboardError, redirectToAdminLogin]);

  const fetchReservations = useCallback(async (filters = reservationFilters) => {
    try {
      setReservationsLoading(true);
      setReservationsError(null);
      const params = new URLSearchParams();
      if (filters.date) params.set("date", filters.date);
      if (filters.status) params.set("status", filters.status);

      const res = await fetch(`/api/reservations/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const data = await parseApiResponse(res, {
        fallback: 'Failed to load reservations.',
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while loading reservations.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      setReservationsError(normalizeDashboardError(err.message));
    } finally {
      setReservationsLoading(false);
    }
  }, [normalizeDashboardError, redirectToAdminLogin, reservationFilters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchReservations(reservationFilters);
  }, [fetchReservations, reservationFilters]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      await parseApiResponse(res, {
        fallback: 'Update failed.',
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while updating an order.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });

      setOrders(prev =>
        prev.map(order => order.order_id === orderId ? { ...order, status: newStatus } : order)
      );
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      alert(`Error: ${normalizeDashboardError(err.message)}`);
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
      time: nextSlots.find(slot => slot.value === prev.time)?.value || nextSlots[0]?.value || ""
    }));
  };

  const handleSaveReservation = async () => {
    if (!selectedReservation) return;

    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${selectedReservation.id}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
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
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while updating a reservation.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });

      setSelectedReservation(data.reservation);
      setReservations(prev =>
        prev.map(reservation => reservation.id === data.reservation.id ? data.reservation : reservation)
      );
      await fetchReservations();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      alert(`Error: ${normalizeDashboardError(err.message)}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const confirmReservation = async (reservation) => {
    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          date: reservation.date,
          time: reservation.time,
          party_size: reservation.party_size,
          status: "confirmed",
          type: reservation.type
        })
      });

      const data = await parseApiResponse(res, {
        fallback: 'Failed to confirm reservation.',
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while confirming a reservation.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });
      setReservations(prev =>
        prev.map(item => item.id === data.reservation.id ? data.reservation : item)
      );
      if (selectedReservation?.id === data.reservation.id) {
        setSelectedReservation(data.reservation);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      alert(`Error: ${normalizeDashboardError(err.message)}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const cancelReservation = async (reservation) => {
    setUpdatingReservation(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          date: reservation.date,
          time: reservation.time,
          party_size: reservation.party_size,
          status: "cancelled",
          type: reservation.type
        })
      });

      const data = await parseApiResponse(res, {
        fallback: 'Failed to cancel reservation.',
        unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
        invalidJson: 'The backend returned invalid JSON while cancelling a reservation.',
        unauthorized: 'Your admin session expired. Please sign in again.',
      });
      setReservations(prev =>
        prev.map(item => item.id === data.reservation.id ? data.reservation : item)
      );
      if (selectedReservation?.id === data.reservation.id) {
        setSelectedReservation(data.reservation);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        redirectToAdminLogin(normalizeDashboardError(err.message));
        return;
      }

      alert(`Error: ${normalizeDashboardError(err.message)}`);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const ordersByStatus = (status) => orders.filter(order => order.status === status);
  const parseItems = (items) => Array.isArray(items) ? items : [];

  const renderOrdersView = () => {
    if (ordersLoading) return <div className="ad-loading">Loading orders…</div>;
    if (ordersError) return <div className="ad-error">⚠ {ordersError}</div>;

    return (
      <>
        <div className="ad-header-right">
          <span className="ad-order-count">{orders.length} total orders</span>
          <button className="ad-refresh-btn" onClick={fetchOrders}>↻ Refresh</button>
        </div>

        <div className="ad-board">
          {ORDER_STATUS_COLUMNS.map(status => (
            <div key={status} className="ad-column">
              <div className={`ad-column-header ad-col-${status}`}>
                <span>{STATUS_LABELS[status]}</span>
                <span className="ad-col-count">{ordersByStatus(status).length}</span>
              </div>

              <div className="ad-column-body">
                {ordersByStatus(status).length === 0 && (
                  <p className="ad-empty">No orders here</p>
                )}
                {ordersByStatus(status).map(order => (
                  <button
                    key={order.order_id}
                    className="ad-order-card"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="ad-card-top">
                      <span className="ad-order-id">#{order.order_id}</span>
                      <span className="ad-order-total">${Number(order.total).toFixed(2)}</span>
                    </div>
                    <div className="ad-card-name">{order.customer_name}</div>
                    <div className="ad-card-items">
                      {parseItems(order.items).map((item, index) => (
                        <span key={index} className="ad-item-pill">{item.item_name}</span>
                      ))}
                    </div>
                    <div className="ad-card-time">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderReservationsView = () => {
    if (reservationsLoading) return <div className="ad-loading">Loading reservations…</div>;
    if (reservationsError) return <div className="ad-error">⚠ {reservationsError}</div>;

    return (
      <>
        <div className="ad-res-toolbar">
          <div className="ad-res-filters">
            <label className="ad-res-filter">
              <span>Date</span>
              <input
                type="date"
                value={reservationFilters.date}
                onChange={event => handleReservationFilterChange("date", event.target.value)}
              />
            </label>
            <label className="ad-res-filter">
              <span>Status</span>
              <select
                value={reservationFilters.status}
                onChange={event => handleReservationFilterChange("status", event.target.value)}
              >
                <option value="">All statuses</option>
                {RESERVATION_STATUSES.map(status => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="ad-header-right">
            <span className="ad-order-count">{reservations.length} reservations</span>
            <button className="ad-refresh-btn" onClick={() => fetchReservations()}>↻ Refresh</button>
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
                <button
                  className="ad-status-btn"
                  onClick={() => openReservationModal(reservation)}
                >
                  Modify
                </button>
                <button
                  className="ad-status-btn is-current"
                  disabled={updatingReservation || reservation.status === "confirmed" || reservation.status === "cancelled"}
                  onClick={() => confirmReservation(reservation)}
                >
                  Confirm
                </button>
                <button
                  className="ad-status-btn ad-status-btn-danger"
                  disabled={updatingReservation || reservation.status === "cancelled"}
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

  return (
    <div className="ad-shell">
      <header className="ad-header">
        <div className="ad-header-left">
          <span className="ad-brand">Ko Japanese Dining</span>
          <span className="ad-title">Admin Dashboard</span>
        </div>
        <div className="ad-view-switch">
          <button
            className={activeView === "orders" ? "ad-view-tab is-active" : "ad-view-tab"}
            onClick={() => setActiveView("orders")}
          >
            Orders
          </button>
          <button
            className={activeView === "reservations" ? "ad-view-tab is-active" : "ad-view-tab"}
            onClick={() => setActiveView("reservations")}
          >
            Reservations
          </button>
        </div>
      </header>

      {activeView === "orders" ? renderOrdersView() : renderReservationsView()}

      {selectedOrder && (
        <div className="ad-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ad-modal" onClick={event => event.stopPropagation()}>
            <button className="ad-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>

            <div className="ad-modal-header">
              <div>
                <p className="ad-modal-label">Order Details</p>
                <h2 className="ad-modal-title">Order #{selectedOrder.order_id}</h2>
              </div>
              <span className={`ad-status-badge ad-col-${selectedOrder.status}`}>
                {STATUS_LABELS[selectedOrder.status]}
              </span>
            </div>

            <div className="ad-modal-grid">
              <div className="ad-detail-block">
                <span className="ad-detail-label">Customer</span>
                <span className="ad-detail-value">{selectedOrder.customer_name}</span>
              </div>
              <div className="ad-detail-block">
                <span className="ad-detail-label">Email</span>
                <span className="ad-detail-value">{selectedOrder.customer_email || "—"}</span>
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
                {parseItems(selectedOrder.items).map((item, index) => (
                  <li key={index} className="ad-item-row">
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
                    className={`ad-status-btn ${selectedOrder.status === status ? "is-current" : ""}`}
                    disabled={
                      selectedOrder.status === status ||
                      updatingOrder === selectedOrder.order_id ||
                      selectedOrder.status === "completed" ||
                      selectedOrder.status === "cancelled"
                    }
                    onClick={() => updateOrderStatus(selectedOrder.order_id, status)}
                  >
                    {updatingOrder === selectedOrder.order_id && status === NEXT_STATUS[selectedOrder.status]
                      ? "Updating…"
                      : STATUS_LABELS[status]}
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
                    ? "Updating…"
                    : `→ Move to ${STATUS_LABELS[NEXT_STATUS[selectedOrder.status]]}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReservation && (
        <div className="ad-overlay" onClick={() => setSelectedReservation(null)}>
          <div className="ad-modal" onClick={event => event.stopPropagation()}>
            <button className="ad-modal-close" onClick={() => setSelectedReservation(null)}>✕</button>

            <div className="ad-modal-header">
              <div>
                <p className="ad-modal-label">Reservation Details</p>
                <h2 className="ad-modal-title">{selectedReservation.confirmation_number}</h2>
              </div>
              <span className={`ad-status-badge ad-col-${selectedReservation.status}`}>
                {STATUS_LABELS[selectedReservation.status]}
              </span>
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
                <input
                  type="date"
                  value={reservationForm.date}
                  onChange={event => handleReservationDateChange(event.target.value)}
                />
              </label>
              <label className="ad-res-edit-field">
                <span>Time</span>
                <select
                  value={reservationForm.time}
                  onChange={event => setReservationForm(prev => ({ ...prev, time: event.target.value }))}
                >
                  {buildAdminTimeSlots(reservationForm.date).map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Party Size</span>
                <select
                  value={reservationForm.partySize}
                  onChange={event => setReservationForm(prev => ({ ...prev, partySize: event.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(size => (
                    <option key={size} value={size}>{size} {size === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Type</span>
                <select
                  value={reservationForm.type}
                  onChange={event => setReservationForm(prev => ({ ...prev, type: event.target.value }))}
                >
                  {RESERVATION_TYPES.map(type => (
                    <option key={type} value={type}>{formatReservationType(type)}</option>
                  ))}
                </select>
              </label>
              <label className="ad-res-edit-field">
                <span>Status</span>
                <select
                  value={reservationForm.status}
                  onChange={event => setReservationForm(prev => ({ ...prev, status: event.target.value }))}
                >
                  {RESERVATION_STATUSES.map(status => (
                    <option key={status} value={status}>{STATUS_LABELS[status]}</option>
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
                <button
                  className="ad-status-btn is-current"
                  disabled={updatingReservation}
                  onClick={handleSaveReservation}
                >
                  {updatingReservation ? "Saving…" : "Save Changes"}
                </button>
                <button
                  className="ad-status-btn"
                  disabled={updatingReservation || selectedReservation.status === "confirmed" || reservationForm.status === "cancelled"}
                  onClick={() => confirmReservation(selectedReservation)}
                >
                  Confirm
                </button>
                <button
                  className="ad-status-btn ad-status-btn-danger"
                  disabled={updatingReservation || selectedReservation.status === "cancelled"}
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
