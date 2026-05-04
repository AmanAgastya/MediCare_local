import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderSuccess.css";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("lastOrder"));
      setOrder(stored);
    } catch {
      setOrder(null);
    }
  }, []);

  return (
    <div className="success-container">
      <div className="success-icon">✅</div>
      <h2>Order Placed Successfully!</h2>
      <p className="success-sub">
        Your medicines will be delivered to your doorstep soon.
      </p>

      {order && (
        <div className="order-details-card">
          {order.orderId && (
            <div className="order-id-badge">Order ID: {order.orderId}</div>
          )}

          <h3>Items Ordered</h3>
          <div className="order-items">
            {order.items?.map((item, i) => (
              <div key={i} className="order-item-row">
                <span>{item.name}</span>
                <span>
                  {item.quantity} × ₹{item.price} ={" "}
                  <strong>₹{item.quantity * item.price}</strong>
                </span>
              </div>
            ))}
          </div>

          <div className="order-meta">
            <div className="meta-row">
              <span>Total Paid</span>
              <strong>₹{order.total}</strong>
            </div>
            <div className="meta-row">
              <span>Payment Method</span>
              <strong>{order.method?.toUpperCase()}</strong>
            </div>
            {order.address && (
              <div className="meta-row">
                <span>Deliver to</span>
                <strong>
                  {order.address.address}, {order.address.city},{" "}
                  {order.address.state} — {order.address.pincode}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="success-actions">
        <button className="btn-primary" onClick={() => navigate("/dashboard")}>
          📦 View My Orders
        </button>
        <button className="btn-outline" onClick={() => navigate("/medstore")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}