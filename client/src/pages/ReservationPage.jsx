import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './ReservationPage.css';

const PARTY_SIZES = [
  { value: '1', label: '1 guest' },
  { value: '2', label: '2 guests' },
  { value: '3', label: '3 guests' },
  { value: '4', label: '4 guests' },
  { value: '5', label: '5 guests' },
  { value: '6', label: '6 guests' },
  { value: '7', label: '7 guests' },
  { value: '8+', label: '8+ guests' },
];

const STORAGE_KEY = 'ko_last_reservation_email';

const RESERVATION_TYPES = [
  {
    value: 'standard',
    label: 'Standard',
    price: 'A la carte pricing',
    description: 'Classic table reservation for regular lunch or dinner service.',
  },
  {
    value: 'kaiseki',
    label: 'Kaiseki',
    price: 'From $110 per guest',
    description: 'Traditional multi-course seasonal dinner with a more formal pacing.',
  },
  {
    value: 'omakase',
    label: 'Omakase',
    price: 'Market price from $130 per guest',
    description: 'Chef-selected tasting built around premium fish and seasonal specialties.',
  },
  {
    value: 'prix-fixe',
    label: 'Prix-fixe',
    price: 'From $85 per guest',
    description: 'Curated fixed-price menu with a set progression of signature dishes.',
  },
  {
    value: 'private-event',
    label: 'Private Event',
    price: 'Custom quote',
    description: 'For celebrations, group buyouts, and tailored hosted dining experiences.',
  },
];

function getMinReservationDate() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
  if (!dateString) return '';

  return new Date(`${dateString}T12:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDisplayTime(timeString) {
  if (!timeString) return '';

  const [hourString = '00', minuteString = '00'] = timeString.split(':');
  const date = new Date();
  date.setHours(Number(hourString), Number(minuteString), 0, 0);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildTimeSlots(dateString) {
  const slots = [];
  const selectedDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  for (let hour = 17; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute > 0) continue;

      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, minute, 0, 0);

      if (isToday && slotDate.getTime() < today.getTime() + 60 * 60 * 1000) {
        continue;
      }

      slots.push({
        value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
        label: slotDate.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      });
    }
  }

  return slots;
}

export default function ReservationPage() {
  const minDate = useMemo(() => getMinReservationDate(), []);
  const [form, setForm] = useState({
    date: minDate,
    time: '',
    partySize: '2',
    reservationType: 'standard',
    name: '',
    email: '',
    phone: '',
    dietaryRestrictions: '',
    eventNotes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [submittedReservation, setSubmittedReservation] = useState(null);

  const timeSlots = useMemo(() => buildTimeSlots(form.date), [form.date]);

  useEffect(() => {
    if (!form.time && timeSlots.length > 0) {
      setForm(prev => ({
        ...prev,
        time: timeSlots[0].value,
      }));
    }
  }, [form.time, timeSlots]);

  const updateField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isValid =
    form.date &&
    form.time &&
    form.partySize &&
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim();

  const handleDateChange = (value) => {
    const nextSlots = buildTimeSlots(value);
    setForm(prev => ({
      ...prev,
      date: value,
      time: nextSlots[0]?.value || '',
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');

    fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: null,
        date: form.date,
        time: form.time,
        party_size: form.partySize === '8+' ? 8 : Number(form.partySize),
        type: form.reservationType,
        name: form.name,
        email: form.email,
        phone: form.phone,
        dietary_restrictions: form.dietaryRestrictions,
        event_notes: form.eventNotes,
      }),
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Reservation request failed.');
        }
        return data;
      })
      .then(data => {
        localStorage.setItem(STORAGE_KEY, form.email.trim().toLowerCase());
        setConfirmationNumber(data.confirmation_number);
        setSubmittedReservation(data.reservation);
        setSubmitted(true);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (submitted) {
    const confirmedDate = submittedReservation?.date || form.date;
    const confirmedTime = submittedReservation?.time || form.time;
    const confirmedPartySize = submittedReservation?.party_size
      ? `${submittedReservation.party_size} ${submittedReservation.party_size === 1 ? 'guest' : 'guests'}`
      : (PARTY_SIZES.find(size => size.value === form.partySize)?.label || form.partySize);
    const confirmedType = RESERVATION_TYPES.find(type => type.value === (submittedReservation?.type || form.reservationType));

    return (
      <div className="reservation-page">
        <section className="reservation-confirmation">
          <div className="reservation-confirmation-mark">KO</div>
          <p className="reservation-eyebrow">Reservation Confirmed</p>
          <h1 className="reservation-title">Your table is booked.</h1>
          <p className="reservation-lead">
            Thanks, {form.name}. Your reservation has been created and your confirmation number is ready below.
          </p>

          <div className="reservation-summary-card">
            <div className="reservation-summary-grid">
              <div>
                <span className="reservation-summary-label">Date</span>
                <strong>{formatDisplayDate(confirmedDate)}</strong>
              </div>
              <div>
                <span className="reservation-summary-label">Time</span>
                <strong>{formatDisplayTime(confirmedTime)}</strong>
              </div>
              <div>
                <span className="reservation-summary-label">Party Size</span>
                <strong>{confirmedPartySize}</strong>
              </div>
              <div>
                <span className="reservation-summary-label">Dining Option</span>
                <strong>{confirmedType?.label || 'Standard'}</strong>
              </div>
              <div>
                <span className="reservation-summary-label">Confirmation Number</span>
                <strong>{confirmationNumber}</strong>
              </div>
            </div>
            <div className="reservation-summary-notes">
              <span className="reservation-summary-label">Contact</span>
              <p>{form.name} | {form.email} | {form.phone}</p>
            </div>
            {form.dietaryRestrictions.trim() && (
              <div className="reservation-summary-notes">
                <span className="reservation-summary-label">Dietary Restrictions</span>
                <p>{form.dietaryRestrictions}</p>
              </div>
            )}
            {form.eventNotes.trim() && (
              <div className="reservation-summary-notes">
                <span className="reservation-summary-label">Event Notes</span>
                <p>{form.eventNotes}</p>
              </div>
            )}
          </div>

          <div className="reservation-confirmation-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSubmitted(false);
                setSubmittedReservation(null);
              }}
            >
              Edit Reservation
            </button>
            <Link to="/" className="btn-outline reservation-link-btn">
              Back to Menu
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="reservation-page">
      <section className="reservation-hero">
        <div className="reservation-hero-copy">
          <p className="reservation-eyebrow">Dining Reservations</p>
          <h1 className="reservation-title">Book a table for sushi, sashimi, or a full kaiseki evening.</h1>
          <p className="reservation-lead">
            Choose a date, pick an available time, and share a few details so we can prepare your table with care.
          </p>

          <div className="reservation-highlights">
            <div className="reservation-highlight-card">
              <span className="reservation-highlight-value">17:00-21:00</span>
              <span className="reservation-highlight-label">Dinner seating window</span>
            </div>
            <div className="reservation-highlight-card">
              <span className="reservation-highlight-value">30 min</span>
              <span className="reservation-highlight-label">Reservation intervals</span>
            </div>
            <div className="reservation-highlight-card">
              <span className="reservation-highlight-value">8+ guests</span>
              <span className="reservation-highlight-label">Large party requests supported</span>
            </div>
          </div>
        </div>

        <aside className="reservation-side-card">
          <p className="reservation-side-title">Reservation Notes</p>
          <ul className="reservation-notes-list">
            <li>Share allergies in dietary restrictions and celebrations in event notes.</li>
            <li>Same-day options only show time slots at least one hour ahead.</li>
            <li>Parties of 8 or more can submit here and we&apos;ll confirm availability directly.</li>
          </ul>
        </aside>
      </section>

      <section className="reservation-content">
        <form className="reservation-form-card" onSubmit={handleSubmit}>
          <div className="reservation-card-header">
            <div>
              <p className="reservation-section-kicker">Reserve Your Table</p>
              <h2>Reservation Details</h2>
            </div>
            <span className="reservation-section-pill">Request Only</span>
          </div>

          <div className="reservation-type-section">
            <div className="reservation-type-header">
              <p className="reservation-type-title">Dining Option</p>
              <p className="reservation-type-subtitle">Choose the experience you want us to prepare for your table.</p>
            </div>
            <div className="reservation-type-grid" role="radiogroup" aria-label="Reservation type">
              {RESERVATION_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={type.value === form.reservationType ? 'reservation-type-card is-active' : 'reservation-type-card'}
                  onClick={() => updateField('reservationType', type.value)}
                  aria-pressed={type.value === form.reservationType}
                >
                  <div className="reservation-type-card-top">
                    <span className="reservation-type-name">{type.label}</span>
                    <span className="reservation-type-price">{type.price}</span>
                  </div>
                  <p className="reservation-type-description">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="reservation-form-grid">
            <div className="reservation-field">
              <label htmlFor="reservation-date">Date</label>
              <input
                id="reservation-date"
                className="reservation-input"
                type="date"
                min={minDate}
                value={form.date}
                onChange={e => handleDateChange(e.target.value)}
                required
              />
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-time">Time Slot</label>
              <select
                id="reservation-time"
                className="reservation-input reservation-select"
                value={form.time}
                onChange={e => updateField('time', e.target.value)}
                disabled={timeSlots.length === 0}
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {timeSlots.length === 0 && (
                <span className="reservation-field-note">
                  No same-day slots remain. Choose another date to continue.
                </span>
              )}
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-party">Party Size</label>
              <select
                id="reservation-party"
                className="reservation-input reservation-select"
                value={form.partySize}
                onChange={e => updateField('partySize', e.target.value)}
                required
              >
                {PARTY_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="reservation-field reservation-field--wide">
              <label htmlFor="reservation-name">Full Name</label>
              <input
                id="reservation-name"
                className="reservation-input"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-email">Email</label>
              <input
                id="reservation-email"
                className="reservation-input"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                required
              />
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-phone">Phone</label>
              <input
                id="reservation-phone"
                className="reservation-input"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={e => updateField('phone', e.target.value)}
                required
              />
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-dietary">Dietary Restrictions</label>
              <textarea
                id="reservation-dietary"
                className="reservation-input reservation-textarea reservation-textarea--compact"
                placeholder="Allergies, ingredient exclusions, or other dietary needs."
                value={form.dietaryRestrictions}
                onChange={e => updateField('dietaryRestrictions', e.target.value)}
              />
            </div>

            <div className="reservation-field">
              <label htmlFor="reservation-event-notes">Event Notes</label>
              <textarea
                id="reservation-event-notes"
                className="reservation-input reservation-textarea reservation-textarea--compact"
                placeholder="Celebration details, seating preferences, or private event context."
                value={form.eventNotes}
                onChange={e => updateField('eventNotes', e.target.value)}
              />
            </div>

          </div>

          {error && (
            <div className="reservation-error-banner">
              {error}
            </div>
          )}

          <div className="reservation-submit-row">
            <p className="reservation-submit-note">
              We&apos;ll review your request and confirm your reservation based on availability.
            </p>
            <button type="submit" className="reservation-submit-btn" disabled={!isValid || loading}>
              {loading ? 'Submitting...' : 'Request Reservation'}
            </button>
          </div>
        </form>

        <div className="reservation-preview-card">
          <p className="reservation-section-kicker">At a Glance</p>
          <h2>Your Reservation</h2>
          <div className="reservation-preview-stack">
            <div className="reservation-preview-row">
              <span>Date</span>
              <strong>{form.date ? formatDisplayDate(form.date) : 'Select a date'}</strong>
            </div>
            <div className="reservation-preview-row">
              <span>Time</span>
              <strong>{timeSlots.find(slot => slot.value === form.time)?.label || 'Choose a time slot'}</strong>
            </div>
            <div className="reservation-preview-row">
              <span>Party</span>
              <strong>{PARTY_SIZES.find(size => size.value === form.partySize)?.label}</strong>
            </div>
            <div className="reservation-preview-row">
              <span>Dining Option</span>
              <strong>{RESERVATION_TYPES.find(type => type.value === form.reservationType)?.label}</strong>
            </div>
            <div className="reservation-preview-row">
              <span>Contact</span>
              <strong>{form.name.trim() || 'Add your contact info'}</strong>
            </div>
            <div className="reservation-preview-row">
              <span>Status</span>
              <strong>{submittedReservation?.status || 'Pending review'}</strong>
            </div>
          </div>

          <div className="reservation-preview-message">
            <p>Selected Experience</p>
            <strong>{RESERVATION_TYPES.find(type => type.value === form.reservationType)?.price}</strong>
            <span className="reservation-preview-detail">
              {RESERVATION_TYPES.find(type => type.value === form.reservationType)?.description}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
