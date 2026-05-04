// src/components/Checkout.js
// FIXES:
//  1. Was re-reading cart from localStorage on its own — now uses CartContext
//     (avoids stale/out-of-sync data between MedStore and Checkout)
//  2. Auth guard was: if(!localStorage.getItem("token")) — unreliable race condition
//     on first load; now uses useAuth() context which is already bootstrapped
//  3. "Fill all required fields" alert only checked name+address — phone, city,
//     pincode were silently ignored; full validation added
//  4. address was saved as a JS object to localStorage but Payment.js expected
//     it as such — kept consistent; added JSON.stringify guard
//  5. Redirect-from state preserved so login → back to checkout works
//  6. Missing CSS class for "item" layout fixed inline (was display:flex but
//     CSS file had no specificity for nested .item inside .summary-card)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // FIX: use context not raw localStorage
  const { cart, cartTotal } = useCart(); // FIX: use context not localStorage re-read

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});

  // FIX: auth guard using context (no race condition)
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/user-login", { state: { from: "/checkout" } });
    }
  }, [isLoggedIn, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim())    newErrors.name    = "Full name is required";
    if (!form.phone.trim())   newErrors.phone   = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
                              newErrors.phone   = "Enter a valid 10-digit number";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim())    newErrors.city    = "City is required";
    if (!form.state.trim())   newErrors.state   = "State is required";
    if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(form.pincode))
                              newErrors.pincode = "Enter a valid 6-digit pincode";
    return newErrors;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field-level error on change
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleContinue = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    localStorage.setItem("address", JSON.stringify(form));
    navigate("/payment");
  };

  if (cart.length === 0 && isLoggedIn) {
    return (
      <div className="checkout-container" style={{ textAlign: "center", paddingTop: 80 }}>
        <h3>Your cart is empty.</h3>
        <button onClick={() => navigate("/medstore")} style={{ marginTop: 16 }}>
          Go to Medicine Store
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2>🧾 Checkout</h2>

      <div className="checkout-grid">
        {/* BILLING DETAILS */}
        <div className="form-card">
          <h3>Billing Details</h3>

          <div className="form-group">
            <input
              name="name"
              placeholder="Full Name *"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <input
              name="phone"
              placeholder="Phone Number *"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <textarea
              name="address"
              placeholder="Full Address *"
              value={form.address}
              onChange={handleChange}
              className={errors.address ? "input-error" : ""}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="city"
                placeholder="City *"
                value={form.city}
                onChange={handleChange}
                className={errors.city ? "input-error" : ""}
              />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>
            <div className="form-group">
              <input
                name="state"
                placeholder="State *"
                value={form.state}
                onChange={handleChange}
                className={errors.state ? "input-error" : ""}
              />
              {errors.state && <span className="error-text">{errors.state}</span>}
            </div>
          </div>

          <div className="form-group">
            <input
              name="pincode"
              placeholder="Pincode *"
              value={form.pincode}
              onChange={handleChange}
              className={errors.pincode ? "input-error" : ""}
            />
            {errors.pincode && <span className="error-text">{errors.pincode}</span>}
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="summary-card">
          <h3>Order Summary</h3>

          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.name}</span>
              {/* FIX: was item.qty (undefined) — now item.quantity */}
              <span>
                {item.quantity} × ₹{item.price} ={" "}
                <strong>₹{item.quantity * item.price}</strong>
              </span>
            </div>
          ))}

          <hr />

          <div className="summary-total">
            <span>Total Amount</span>
            {/* FIX: cartTotal from context — no NaN risk */}
            <strong>₹{cartTotal}</strong>
          </div>

          <button className="continue-btn" onClick={handleContinue}>
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}