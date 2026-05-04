import React, { useState, useEffect, useCallback } from "react";
//import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
 // const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState("hospitals");
  const [hospitals, setHospitals]     = useState([]);
  const [feedbacks, setFeedbacks]     = useState([]);
  const [activity, setActivity]       = useState([]);
  const [orders, setOrders]           = useState([]);  // FIX: new state
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText]     = useState("");

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/hospitals`, { headers: getAuthHeader() });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to fetch hospitals");
      }
      setHospitals(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/feedback`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      setFeedbacks(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/activity`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch activity");
      setActivity(await res.json());
    } catch (err) {
      // FIX: was missing try/catch — now non-fatal
      console.warn("Activity fetch failed:", err.message);
    }
  }, []);

  // FIX: New — fetch all medicine orders for admin
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/order/all`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch orders");
      setOrders(await res.json());
    } catch (err) {
      console.warn("Orders fetch failed:", err.message);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
    fetchFeedbacks();
    fetchActivity();
    fetchOrders(); // FIX: load orders on mount
  }, [fetchHospitals, fetchFeedbacks, fetchActivity, fetchOrders]);

  // FIX: New — update order status from admin panel
  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API}/api/order/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: updated.orderStatus } : o))
      );
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const updateHospitalStatus = async (id, accepted) => {
    setActionLoading(id + (accepted ? "_accept" : "_reject"));
    try {
      const res = await fetch(`${API}/api/admin/hospitals/${id}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ accepted }),
      });
      if (!res.ok) throw new Error("Failed to update hospital status");
      await fetchHospitals();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchFilter =
      filter === "all" ||
      (filter === "accepted" && h.accepted) ||
      (filter === "pending" && !h.accepted);
    const matchSearch =
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const STATUS_OPTIONS = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {error && <div className="admin-error">{error}</div>}

      {/* TAB BAR — FIX: added "Medicine Orders" tab */}
      <div className="admin-tabs">
        {["hospitals", "feedback", "activity", "orders"].map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "hospitals" && "🏥 Hospitals"}
            {tab === "feedback"  && "💬 Feedback"}
            {tab === "activity"  && "📊 Activity"}
            {tab === "orders"    && `💊 Medicine Orders ${orders.length > 0 ? `(${orders.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── HOSPITALS TAB ────────────────────────────────────────────────── */}
      {activeTab === "hospitals" && (
        <div className="admin-section">
          <div className="admin-controls">
            <input
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {loading ? (
            <p>Loading hospitals…</p>
          ) : filteredHospitals.length === 0 ? (
            <p>No hospitals found.</p>
          ) : (
            filteredHospitals.map((h) => (
              <div key={h._id} className="admin-card">
                <div className="admin-card-info">
                  <h3>{h.name}</h3>
                  <p>{h.email} · {h.city}</p>
                  <span className={`status-badge ${h.accepted ? "accepted" : "pending"}`}>
                    {h.accepted ? "✅ Accepted" : "⏳ Pending"}
                  </span>
                </div>
                {!h.accepted && (
                  <div className="admin-card-actions">
                    <button
                      onClick={() => updateHospitalStatus(h._id, true)}
                      disabled={actionLoading === h._id + "_accept"}
                      className="btn-accept"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateHospitalStatus(h._id, false)}
                      disabled={actionLoading === h._id + "_reject"}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── FEEDBACK TAB ─────────────────────────────────────────────────── */}
      {activeTab === "feedback" && (
        <div className="admin-section">
          {feedbacks.length === 0 ? (
            <p>No feedback received yet.</p>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb._id} className="admin-card">
                <p><strong>{fb.name}</strong> — {fb.email}</p>
                <p>{fb.message}</p>
                <button onClick={() => setSelectedFeedback(fb)}>Reply</button>
              </div>
            ))
          )}
          {selectedFeedback && (
            <div className="feedback-reply-modal">
              <h3>Reply to {selectedFeedback.name}</h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply…"
              />
              <button onClick={() => { setSelectedFeedback(null); setReplyText(""); }}>
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="admin-section">
          {activity.length === 0 ? (
            <p>No activity logs found.</p>
          ) : (
            activity.map((a, i) => (
              <div key={i} className="admin-card">
                <p>{a.description || JSON.stringify(a)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ORDERS TAB (NEW) ─────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <div className="admin-section">
          <h2>💊 All Medicine Orders</h2>

          {orders.length === 0 ? (
            <p>No medicine orders yet.</p>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="order-id-cell">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <div>{order.user?.name || "—"}</div>
                        <div className="sub-text">{order.user?.email}</div>
                      </td>
                      <td>
                        {order.items.map((item, i) => (
                          <div key={i} className="order-item-mini">
                            {item.name} ×{item.quantity}
                          </div>
                        ))}
                      </td>
                      <td>
                        <strong>₹{order.totalAmount}</strong>
                      </td>
                      <td>
                        <span
                          className={`pay-badge ${
                            order.paymentStatus === "Paid" ? "paid" : "pending"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <select
                          value={order.orderStatus}
                          disabled={actionLoading === order._id}
                          onChange={(e) =>
                            updateOrderStatus(order._id, e.target.value)
                          }
                          className="status-select"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;