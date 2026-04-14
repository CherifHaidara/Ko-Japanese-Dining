import React, { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const TODAY = new Date().toISOString().slice(0, 10);
const THIRTY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
})();

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

  // ── Analytics state ───────────────────────────────────────────────────────
  const [activeTab,       setActiveTab]       = useState("orders"); // "orders" | "analytics"
  const [analytics,       setAnalytics]       = useState(null);
  const [analyticsLoading,setAnalyticsLoading]= useState(false);
  const [analyticsError,  setAnalyticsError]  = useState(null);
  const [dateStart,       setDateStart]       = useState(THIRTY_DAYS_AGO);
  const [dateEnd,         setDateEnd]         = useState(TODAY);

  const fetchAnalytics = useCallback(async (start, end) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(
        `/api/admin/analytics?start=${start}&end=${end}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) throw new Error("Failed to load analytics.");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

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

  // Load analytics when tab first opens
  useEffect(() => {
    if (activeTab === "analytics" && !analytics) {
      fetchAnalytics(dateStart, dateEnd);
    }
  }, [activeTab, analytics, dateStart, dateEnd, fetchAnalytics]);

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

  const parseItems = (items) => Array.isArray(items) ? items : [];

  if (loading) return <div className="ad-loading">Loading orders…</div>;
  if (error)   return <div className="ad-error">⚠ {error}</div>;

  // ── Status color map for analytics ───────────────────────────────────────
  const STATUS_COLORS = {
    pending:   "#ffd966",
    confirmed: "#66b2ff",
    preparing: "#ff9933",
    ready:     "#66ff99",
    completed: "#aaa",
    cancelled: "#ff6666"
  };

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

      {/* ── Tab Bar ── */}
      <div className="ad-tabs">
        <button
          className={`ad-tab ${activeTab === "orders" ? "ad-tab--active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`ad-tab ${activeTab === "analytics" ? "ad-tab--active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {/* ── Orders Tab: Kanban Board ── */}
      {activeTab === "orders" && (
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
                        <span key={i} className="ad-item-pill">{item.item_name}</span>
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
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && (
        <div className="ad-analytics">

          {/* Date Range Picker */}
          <div className="an-date-bar">
            <label className="an-date-label">
              From
              <input
                type="date"
                className="an-date-input"
                value={dateStart}
                max={dateEnd}
                onChange={e => setDateStart(e.target.value)}
              />
            </label>
            <label className="an-date-label">
              To
              <input
                type="date"
                className="an-date-input"
                value={dateEnd}
                min={dateStart}
                max={TODAY}
                onChange={e => setDateEnd(e.target.value)}
              />
            </label>
            <button
              className="ad-refresh-btn"
              onClick={() => fetchAnalytics(dateStart, dateEnd)}
              disabled={analyticsLoading}
            >
              {analyticsLoading ? "Loading…" : "Apply"}
            </button>
          </div>

          {analyticsError && <div className="ad-error" style={{ minHeight: "unset", padding: "16px 24px" }}>⚠ {analyticsError}</div>}

          {analytics && !analyticsLoading && (
            <>
              {/* Stat Cards */}
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

              {/* Orders by Status */}
              <div className="an-section">
                <h3 className="an-section-title">Orders by Status</h3>
                <div className="an-status-grid">
                  {ALL_STATUSES.map(s => {
                    const entry = analytics.orders_by_status.find(r => r.status === s);
                    return (
                      <div key={s} className="an-status-card" style={{ borderColor: STATUS_COLORS[s] }}>
                        <span className="an-status-name" style={{ color: STATUS_COLORS[s] }}>
                          {STATUS_LABELS[s]}
                        </span>
                        <span className="an-status-count">{entry ? entry.count : 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Orders by Day Chart */}
              <div className="an-section">
                <h3 className="an-section-title">Order Volume by Day</h3>
                {analytics.orders_by_day.length === 0 ? (
                  <p className="ad-empty" style={{ textAlign: "left" }}>No order data for this range.</p>
                ) : (
                  <div className="an-chart-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={analytics.orders_by_day}
                        margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#666", fontSize: 12 }}
                          tickFormatter={d => {
                            const [, m, day] = d.split("-");
                            return `${m}/${day}`;
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "#666", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={28}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(206,1,0,0.08)" }}
                          contentStyle={{
                            background: "#111",
                            border: "1px solid #333",
                            borderRadius: "6px",
                            fontSize: "13px"
                          }}
                          labelStyle={{ color: "#aaa", marginBottom: "4px" }}
                          itemStyle={{ color: "#ce0100" }}
                          formatter={(value) => [value, "Orders"]}
                        />
                        <Bar
                          dataKey="order_count"
                          fill="#ce0100"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top Items */}
              <div className="an-section">
                <h3 className="an-section-title">Top Items</h3>
                {analytics.top_items.length === 0 ? (
                  <p className="ad-empty" style={{ textAlign: "left" }}>No item data for this range.</p>
                ) : (
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Qty Sold</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
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

          {analyticsLoading && (
            <div className="ad-loading" style={{ minHeight: "200px" }}>Loading analytics…</div>
          )}
        </div>
      )}

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