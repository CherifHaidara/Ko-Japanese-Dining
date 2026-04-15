import { useCallback, useEffect, useState } from 'react';
import './AccountReservationsPage.css';
import { normalizeApiError, parseApiResponse } from '../utils/api';

const STORAGE_KEY = 'ko_last_reservation_email';
const PARTY_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ACCOUNT_RESERVATION_ERROR_OPTIONS = {
  fallback: 'Failed to load upcoming reservations.',
  unavailable: 'The reservation service is unavailable right now. Make sure the backend server is running on the configured API port and try again.',
  invalidJson: 'The reservation endpoint returned an invalid response. Make sure the backend server is running and serving reservation routes.',
};

function formatDisplayDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString([], {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(timeString) {
  const [hourString = '00', minuteString = '00'] = timeString.split(':');
  const date = new Date();
  date.setHours(Number(hourString), Number(minuteString), 0, 0);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTypeLabel(type) {
  return type
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildTimeSlots(dateString) {
  const slots = [];
  const selectedDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  for (let hour = 17; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute > 0) continue;

      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, minute, 0, 0);

      if (isToday && slotDate.getTime() < now.getTime()) {
        continue;
      }

      slots.push({
        value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
        label: slotDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
    }
  }

  return slots;
}

export default function AccountReservationsPage() {
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [submittedEmail, setSubmittedEmail] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingReservation, setEditingReservation] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', partySize: '2' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReservations = useCallback(async (lookupEmail) => {
    if (!lookupEmail.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/upcoming?email=${encodeURIComponent(lookupEmail.trim())}`);
      const data = await parseApiResponse(response, ACCOUNT_RESERVATION_ERROR_OPTIONS);

      localStorage.setItem(STORAGE_KEY, lookupEmail.trim().toLowerCase());
      setSubmittedEmail(lookupEmail.trim().toLowerCase());
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (err) {
      setReservations([]);
      setError(normalizeApiError(err.message, ACCOUNT_RESERVATION_ERROR_OPTIONS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (submittedEmail) {
      fetchReservations(submittedEmail);
    }
  }, [fetchReservations, submittedEmail]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccessMessage('');
    fetchReservations(email);
  };

  const openEditModal = (reservation) => {
    setEditingReservation(reservation);
    setEditForm({
      date: reservation.date,
      time: reservation.time,
      partySize: String(reservation.party_size),
    });
    setError('');
    setSuccessMessage('');
  };

  const handleEditDateChange = (value) => {
    const nextSlots = buildTimeSlots(value);
    setEditForm(prev => ({
      ...prev,
      date: value,
      time: nextSlots.find(slot => slot.value === prev.time)?.value || nextSlots[0]?.value || '',
    }));
  };

  const handleUpdateReservation = async (event) => {
    event.preventDefault();
    if (!editingReservation) return;

    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/reservations/${editingReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: submittedEmail,
          date: editForm.date,
          time: editForm.time,
          party_size: Number(editForm.partySize),
        }),
      });

      const data = await parseApiResponse(response, {
        ...ACCOUNT_RESERVATION_ERROR_OPTIONS,
        fallback: 'Failed to update reservation.',
      });

      setEditingReservation(null);
      setSuccessMessage(`Reservation ${data.reservation.confirmation_number} updated successfully.`);
      await fetchReservations(submittedEmail);
    } catch (err) {
      setError(normalizeApiError(err.message, ACCOUNT_RESERVATION_ERROR_OPTIONS));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async (reservation) => {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/reservations/${reservation.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: submittedEmail,
        }),
      });

      const data = await parseApiResponse(response, {
        ...ACCOUNT_RESERVATION_ERROR_OPTIONS,
        fallback: 'Failed to cancel reservation.',
      });

      setSuccessMessage(`Reservation ${data.confirmation_number} cancelled successfully.`);
      await fetchReservations(submittedEmail);
    } catch (err) {
      setError(normalizeApiError(err.message, ACCOUNT_RESERVATION_ERROR_OPTIONS));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="account-shell">
      <section className="account-hero">
        <div>
          <p className="account-eyebrow">Customer Account</p>
          <h1 className="account-title">Upcoming Reservations</h1>
          <p className="account-copy">
            Enter the email used for your reservation to see your upcoming dining plans.
          </p>
        </div>
        <form className="account-search" onSubmit={handleSubmit}>
          <label htmlFor="account-email" className="account-label">Reservation Email</label>
          <div className="account-search-row">
            <input
              id="account-email"
              className="account-input"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="account-submit" disabled={loading}>
              {loading ? 'Loading...' : 'View Reservations'}
            </button>
          </div>
        </form>
      </section>

      {error ? <div className="account-error">{error}</div> : null}
      {successMessage ? <div className="account-success">{successMessage}</div> : null}

      <section className="account-list-shell">
        <div className="account-list-header">
          <div>
            <p className="account-section-kicker">My Bookings</p>
            <h2>{submittedEmail ? `Upcoming reservations for ${submittedEmail}` : 'No customer selected yet'}</h2>
          </div>
          <span className="account-count">{reservations.length} upcoming</span>
        </div>

        {!loading && submittedEmail && reservations.length === 0 ? (
          <div className="account-empty">
            No upcoming reservations were found for that email.
          </div>
        ) : null}

        <div className="account-list">
          {reservations.map(reservation => (
            <article key={reservation.id} className="account-card">
              <div className="account-card-top">
                <div>
                  <p className="account-card-label">Confirmation</p>
                  <h3>{reservation.confirmation_number}</h3>
                </div>
                <span className="account-status">{reservation.status}</span>
              </div>

              <div className="account-card-grid">
                <div>
                  <span className="account-card-label">Date</span>
                  <strong>{formatDisplayDate(reservation.date)}</strong>
                </div>
                <div>
                  <span className="account-card-label">Time</span>
                  <strong>{formatDisplayTime(reservation.time)}</strong>
                </div>
                <div>
                  <span className="account-card-label">Party Size</span>
                  <strong>{reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}</strong>
                </div>
                <div>
                  <span className="account-card-label">Type</span>
                  <strong>{formatTypeLabel(reservation.type)}</strong>
                </div>
              </div>

              <div className="account-card-footer">
                <div className="account-cutoff">
                  {reservation.can_modify
                    ? `Changes allowed until ${new Date(reservation.cutoff_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                    : 'Cutoff passed for changes or cancellation.'}
                </div>
                <div className="account-actions">
                  <button
                    type="button"
                    className="account-action-btn"
                    onClick={() => openEditModal(reservation)}
                    disabled={!reservation.can_modify || actionLoading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="account-action-btn account-action-btn--danger"
                    onClick={() => handleCancelReservation(reservation)}
                    disabled={!reservation.can_cancel || actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingReservation ? (
        <div className="account-modal-overlay" onClick={() => setEditingReservation(null)}>
          <div className="account-modal" onClick={event => event.stopPropagation()}>
            <div className="account-modal-header">
              <div>
                <p className="account-section-kicker">Modify Reservation</p>
                <h3>{editingReservation.confirmation_number}</h3>
              </div>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setEditingReservation(null)}
              >
                ×
              </button>
            </div>

            <form className="account-modal-form" onSubmit={handleUpdateReservation}>
              <div className="account-modal-grid">
                <label className="account-modal-field">
                  <span>Date</span>
                  <input
                    className="account-input"
                    type="date"
                    value={editForm.date}
                    onChange={e => handleEditDateChange(e.target.value)}
                    required
                  />
                </label>

                <label className="account-modal-field">
                  <span>Time</span>
                  <select
                    className="account-input"
                    value={editForm.time}
                    onChange={e => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                    required
                  >
                    {buildTimeSlots(editForm.date).map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </label>

                <label className="account-modal-field">
                  <span>Party Size</span>
                  <select
                    className="account-input"
                    value={editForm.partySize}
                    onChange={e => setEditForm(prev => ({ ...prev, partySize: e.target.value }))}
                    required
                  >
                    {PARTY_SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>{size} {size === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="account-modal-actions">
                <button type="submit" className="account-submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
