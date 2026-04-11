import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

const TAX_RATE = 0.0875;

function generatePickupTimes() {
  const times = [];
  const now = new Date();
  // Round up to next 15-min slot, minimum 20 min from now
  now.setMinutes(now.getMinutes() + 20);
  const start = new Date(now);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);

  for (let i = 0; i < 12; i++) {
    const t = new Date(start.getTime() + i * 15 * 60000);
    times.push(
      t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }
  return times;
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const pickupTimes = useMemo(() => generatePickupTimes(), []);

  const tax        = totalPrice * TAX_RATE;
  const orderTotal = totalPrice + tax;

  const [form, setForm] = useState({
    name:         '',
    email:        '',
    pickupTime:   pickupTimes[0] || '',
    instructions: '',
    cardNumber:   '',
    expiry:       '',
    cvv:          '',
  });

  const [submitted,      setSubmitted]      = useState(false);
  const [orderId,        setOrderId]        = useState(null);
  const [orderSnapshot,  setOrderSnapshot]  = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.pickupTime &&
    form.cardNumber.replace(/\s/g, '').length === 16 &&
    form.expiry.length === 5 &&
    form.cvv.length >= 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:  form.name,
          customer_email: form.email,
          notes:          `Pickup at ${form.pickupTime}${form.instructions ? '. ' + form.instructions : ''}`,
          total:          orderTotal.toFixed(2),
          items:          items.map(item => ({
            item_name:  item.name,
            item_price: item.price,
            quantity:   item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Order failed.');

      setOrderId(data.order_id);
      setOrderSnapshot({
        name:       form.name,
        pickupTime: form.pickupTime,
        items:      [...items],
        subtotal:   totalPrice,
        tax,
        total:      orderTotal,
      });
      clearCart();
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !submitted) {
    return (
      <div className="checkout-shell">
        <div className="checkout-success">
          <div className="checkout-success-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add items from the menu before checking out.</p>
          <Link to="/" className="checkout-success-btn">Browse Menu</Link>
        </div>
      </div>
    );
  }

  if (submitted && orderSnapshot) {
    const { name, pickupTime, items: snapItems, subtotal, tax: snapTax, total: snapTotal } = orderSnapshot;
    return (
      <div className="checkout-shell">
        <div className="confirmation-wrap">
          <div className="confirmation-header">
            <div className="confirmation-check">&#10003;</div>
            <h1 className="confirmation-title">Order Confirmed</h1>
            <p className="confirmation-sub">Thank you, {name}. We have received your order.</p>
          </div>

          <div className="confirmation-body">
            <div className="confirmation-meta">
              <div className="confirmation-meta-item">
                <span className="confirmation-meta-label">Order Number</span>
                <span className="confirmation-meta-value">#{orderId}</span>
              </div>
              <div className="confirmation-meta-item">
                <span className="confirmation-meta-label">Estimated Pickup</span>
                <span className="confirmation-meta-value">{pickupTime}</span>
              </div>
            </div>

            <div className="confirmation-items">
              <p className="confirmation-section-title">Items Ordered</p>
              {snapItems.map((item, i) => (
                <div key={i} className="confirmation-item">
                  {item.image && <img src={item.image} alt={item.name} className="confirmation-item-img" />}
                  <div className="confirmation-item-info">
                    <span className="confirmation-item-name">{item.name}</span>
                    <span className="confirmation-item-qty">x{item.quantity}</span>
                  </div>
                  <span className="confirmation-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="confirmation-totals">
              <div className="confirmation-total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="confirmation-total-row">
                <span>Tax (8.75%)</span>
                <span>${snapTax.toFixed(2)}</span>
              </div>
              <div className="confirmation-total-row confirmation-total-row--grand">
                <span>Total</span>
                <span>${snapTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Link to="/" className="checkout-success-btn">Back to Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      <Link to="/" className="checkout-back">← Back to Menu</Link>
      <h1 className="checkout-heading">Checkout</h1>
      <p className="checkout-subheading">Review your order and complete your details below.</p>

      <div className="checkout-layout">

        {/* ── Left: Form ── */}
        <form className="checkout-form" onSubmit={handleSubmit}>

          {/* Contact */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <p className="checkout-card-title">Contact Information</p>
            </div>
            <div className="checkout-section">
              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-field" style={{ paddingBottom: 20 }}>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pickup */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <p className="checkout-card-title">Pickup Details</p>
            </div>
            <div className="checkout-section">
              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">Pickup Time</label>
                <select
                  className="form-select"
                  value={form.pickupTime}
                  onChange={e => set('pickupTime', e.target.value)}
                >
                  {pickupTimes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ paddingBottom: 20 }}>
                <label className="form-label">Special Instructions <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Allergies, dietary restrictions, or any other requests..."
                  value={form.instructions}
                  onChange={e => set('instructions', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <p className="checkout-card-title">Payment</p>
            </div>
            <div className="checkout-section">
              <p className="payment-notice" style={{ marginTop: 16 }}>
                This is a simulated payment — no real charges will be made.
              </p>
              <div className="form-field">
                <label className="form-label">Card Number</label>
                <div className="card-number-wrap">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={e => set('cardNumber', formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <span className="card-icon">💳</span>
                </div>
              </div>
              <div className="form-row" style={{ paddingBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="form-label">Expiry Date</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={e => set('expiry', formatExpiry(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="form-label">CVV</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="123"
                    value={form.cvv}
                    onChange={e => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p style={{ padding: '0 24px 12px', fontSize: 13, color: 'var(--red)' }}>{error}</p>
            )}

            <div className="checkout-submit-wrap">
              <button
                type="submit"
                className="checkout-submit-btn"
                disabled={!isValid || loading}
              >
                {loading ? 'Placing Order…' : `Place Order — $${orderTotal.toFixed(2)}`}
              </button>
            </div>
          </div>

        </form>

        {/* ── Right: Order Summary ── */}
        <div className="checkout-card">
          <div className="checkout-card-header">
            <p className="checkout-card-title">Order Summary — {items.reduce((s, i) => s + i.quantity, 0)} items</p>
          </div>
          <div className="summary-items">
            {items.map((item, i) => (
              <div key={i} className="summary-item">
                <img src={item.image} alt={item.name} className="summary-item-img" />
                <div className="summary-item-info">
                  <p className="summary-item-name">{item.name}</p>
                  <p className="summary-item-qty">Qty: {item.quantity}</p>
                </div>
                <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider" />
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8.75%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row summary-row-total">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
