import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderStatusPage.css';

const STEPS = [
  { key: 'pending',   label: 'Order Received' },
  { key: 'confirmed', label: 'Confirmed'       },
  { key: 'preparing', label: 'Being Prepared'  },
  { key: 'ready',     label: 'Ready for Pickup'},
  { key: 'completed', label: 'Picked Up'       },
];

function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  return STEPS.findIndex(s => s.key === status);
}

export default function OrderStatusPage() {
  const { id } = useParams();
  const [order,   setOrder]   = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order not found.');
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 30 seconds so status updates without a manual refresh
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="status-shell">
        <div className="status-loading">Loading order…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-shell">
        <div className="status-error">
          <p>{error}</p>
          <Link to="/" className="status-back-btn">Back to home</Link>
        </div>
      </div>
    );
  }

  const cancelled  = order.status === 'cancelled';
  const isReady = order.status === 'ready';
  const stepIndex  = getStepIndex(order.status);
  const pickupTime = order.notes?.match(/Pickup at (.+?)(?:\.|$)/)?.[1] || null;


  return (
    <div className="status-shell">
      <Link to="/" className="status-back">← Back to home</Link>

      <div className="status-wrap">

        {/* Header */}
        <div className="status-header">
          <p className="status-order-num">Order #{order.order_id}</p>
          <h1 className="status-title">
            {cancelled ? 'Order Cancelled' : STEPS[stepIndex]?.label || 'Order Status'}
          </h1>
          {pickupTime && !cancelled && (
            <p className="status-pickup">Estimated pickup: <strong>{pickupTime}</strong></p>
          )}
        </div>

          {order.status === 'ready' && (
            <div className="status-ready-banner">
              setError("Order is ready");
            </div>
          )}
        {/* Progress tracker */}
        {!cancelled ? (
          <div className="status-tracker">
            {STEPS.map((step, i) => {
              const done    = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={step.key} className="status-step-wrap">
                  <div className={`status-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                    <div className="status-dot">
                      {done && <span className="status-dot-check">&#10003;</span>}
                      {current && <span className="status-dot-pulse" />}
                    </div>
                    <p className="status-step-label">{step.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`status-line ${done ? 'done' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="status-cancelled-msg">
            This order has been cancelled. Please contact us if you have questions.
          </div>
        )}

        {/* Items */}
        <div className="status-items-card">
          <p className="status-items-title">Items Ordered</p>
          {order.items.map((item, i) => (
            <div key={i} className="status-item">
              <div className="status-item-info">
                <span className="status-item-name">{item.item_name}</span>
                <span className="status-item-qty">x{item.quantity}</span>
              </div> 
              <span className="status-item-price">
                ${(parseFloat(item.item_price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="status-total-row">
            <span>Total</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        <p className="status-refresh-note">Status refreshes automatically every 30 seconds.</p>
      </div>
    </div>
  );
}
