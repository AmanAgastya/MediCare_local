import { useNavigate } from "react-router-dom";
import { X, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const {
    cart,
    cartTotal,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate("/user-login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="cart-page-container">
      <h2>
        <ShoppingCart size={24} /> Your Cart
      </h2>

      {cart.length === 0 ? (
        <div className="cart-empty-state">
          <ShoppingCart size={64} opacity={0.3} />
          <p>Your cart is empty.</p>
          <button onClick={() => navigate("/medstore")}>Browse Medicines</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-page-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <span className="item-category">{item.category}</span>
                </div>

                {/* FIX: now correctly shows item.quantity (was item.qty → NaN) */}
                <div className="qty-controls">
                  <button onClick={() => decreaseQty(item.id)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>

                <span className="item-price">
                  ₹{item.price * item.quantity}
                </span>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
            <div className="cart-summary">
              {/* FIX: cartTotal was NaN because qty field was wrong */}
              <h3>Total: ₹{cartTotal}</h3>
              <button className="checkout-btn" onClick={handleCheckout}>
                {isLoggedIn ? "Checkout →" : "Login to Checkout →"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}