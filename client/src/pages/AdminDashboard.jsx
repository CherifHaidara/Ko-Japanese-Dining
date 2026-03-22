import React, { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const STATUS_COLUMNS = ["pending", "confirmed", "preparing", "ready"];
const ALL_STATUSES   = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

const STATUS_LABELS = {
  pending:   "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready:     "Ready",
  completed: "Completed",
  cancelled: "Cancelled"
};

const NEXT_STATUS = {
  pending:   "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready:     "completed"
};

function getToken() {
  return localStorage.getItem("token");
}

export default function AdminDashboard() {
  const [orders,        setOrders]        = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [updating,      setUpdating]      = useState(null); // order_id being updated

  // ── Fetch all orders ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to load orders.");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Update order status ───────────────────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed.");
      }

      // Update local state immediately (no need to re-fetch)
      setOrders(prev =>
        prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o)
      );
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const ordersByStatus = (status) =>
    orders.filter(o => o.status === status);

  const parseItems = (items) => {
    try {
      return typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      return [];
    }
  };

  if (loading) return <div className="ad-loading">Loading orders…</div>;
  if (error)   return <div className="ad-error">⚠ {error}</div>;

  return (
    <div className="ad-shell">
      {/* ── Header ── */}
      <header className="ad-header">
        <div className="ad-header-left">
          <span className="ad-brand">Ko Japanese Dining</span>
          <span className="ad-title">Admin Dashboard</span>
        </div>
        <div className="ad-header-right">
          <span className="ad-order-count">{orders.length} total orders</span>
          <button className="ad-refresh-btn" onClick={fetchOrders}>↻ Refresh</button>
        </div>
      </header>

      {/* ── Kanban Board ── */}
      <div className="ad-board">
        {STATUS_COLUMNS.map(status => (
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
                    {parseItems(order.items).map((item, i) => (
                      <span key={i} className="ad-item-pill">{item.name}</span>
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

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div className="ad-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
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
                <span className="ad-detail-value">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="ad-items-section">
              <h4>Items Ordered</h4>
              <ul className="ad-items-list">
                {parseItems(selectedOrder.items).map((item, i) => (
                  <li key={i} className="ad-item-row">
                    <span>{item.name}</span>
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

            {/* Status Controls */}
            <div className="ad-status-controls">
              <h4>Update Status</h4>
              <div className="ad-status-buttons">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    className={`ad-status-btn ${selectedOrder.status === s ? "is-current" : ""}`}
                    disabled={
                      selectedOrder.status === s ||
                      updating === selectedOrder.order_id ||
                      selectedOrder.status === "completed" ||
                      selectedOrder.status === "cancelled"
                    }
                    onClick={() => updateStatus(selectedOrder.order_id, s)}
                  >
                    {updating === selectedOrder.order_id && s === NEXT_STATUS[selectedOrder.status]
                      ? "Updating…"
                      : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {NEXT_STATUS[selectedOrder.status] && (
                <button
                  className="ad-advance-btn"
                  disabled={updating === selectedOrder.order_id}
                  onClick={() => updateStatus(selectedOrder.order_id, NEXT_STATUS[selectedOrder.status])}
                >
                  {updating === selectedOrder.order_id
                    ? "Updating…"
                    : `→ Move to ${STATUS_LABELS[NEXT_STATUS[selectedOrder.status]]}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
