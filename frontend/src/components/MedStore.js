import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Search, Filter, ShoppingCart, X, Pill, Thermometer, Stethoscope, Syringe,} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./MedStore.css";

// MOVED OUTSIDE COMPONENT — was re-created on every render (performance bug)
const MEDICINES = [
  { id: 1,  name: "Aspirin",             price: 25,  category: "Pain Relief",     icon: Pill        },
  { id: 2,  name: "Ibuprofen",           price: 60,  category: "Pain Relief",     icon: Pill        },
  { id: 3,  name: "Paracetamol",         price: 40,  category: "Pain Relief",     icon: Pill        },
  { id: 4,  name: "Amoxicillin",         price: 100, category: "Antibiotics",     icon: Pill        },
  { id: 5,  name: "Azithromycin",        price: 120, category: "Antibiotics",     icon: Pill        },
  { id: 6,  name: "Ciprofloxacin",       price: 140, category: "Antibiotics",     icon: Pill        },
  { id: 7,  name: "Lisinopril",          price: 85,  category: "Blood Pressure",  icon: Thermometer },
  { id: 8,  name: "Amlodipine",          price: 90,  category: "Blood Pressure",  icon: Thermometer },
  { id: 9,  name: "Losartan",            price: 95,  category: "Blood Pressure",  icon: Thermometer },
  { id: 10, name: "Metformin",           price: 70,  category: "Diabetes",        icon: Syringe     },
  { id: 11, name: "Insulin",             price: 200, category: "Diabetes",        icon: Syringe     },
  { id: 12, name: "Glimepiride",         price: 85,  category: "Diabetes",        icon: Syringe     },
  { id: 13, name: "Omeprazole",          price: 190, category: "Digestive Health",icon: Stethoscope },
  { id: 14, name: "Pantoprazole",        price: 150, category: "Digestive Health",icon: Stethoscope },
  { id: 15, name: "Ranitidine",          price: 130, category: "Digestive Health",icon: Stethoscope },
  { id: 16, name: "Vitamin C",           price: 70,  category: "Vitamins",        icon: Pill        },
  { id: 17, name: "Vitamin E",           price: 90,  category: "Vitamins",        icon: Pill        },
  { id: 18, name: "Calcium Tablets",     price: 110, category: "Vitamins",        icon: Pill        },
  { id: 19, name: "Vitamin D3",          price: 120, category: "Vitamins",        icon: Pill        },
  { id: 20, name: "Cetirizine",          price: 50,  category: "Allergy",         icon: Pill        },
  { id: 21, name: "Loratadine",          price: 65,  category: "Allergy",         icon: Pill        },
  { id: 22, name: "Hydrocortisone Cream",price: 90,  category: "Skin Care",       icon: Pill        },
  { id: 23, name: "Clotrimazole",        price: 75,  category: "Skin Care",       icon: Pill        },
  { id: 24, name: "ORS Sachet",          price: 30,  category: "General Health",  icon: Pill        },
  { id: 25, name: "Antacid Syrup",       price: 95,  category: "General Health",  icon: Stethoscope },
  { id: 26, name: "Dolo 650",            price: 35,  category: "Fever",           icon: Thermometer },
  { id: 27, name: "Crocin",              price: 45,  category: "Fever",           icon: Thermometer },
];

const CATEGORIES = ["All", ...new Set(MEDICINES.map((m) => m.category))];

const MedStore = () => {
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // FIX: use context instead of raw localStorage
  const {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
  } = useCart();

  const filteredMedicines = MEDICINES.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || med.category === selectedCategory)
  );

  // FIX: use AuthContext — avoids stale localStorage reads
  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate("/user-login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="med-store">
      <h1>Medical Store</h1>

      {/* SEARCH */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="clear-search"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="store-content">
        {/* FILTER SIDEBAR */}
        <aside className="filters">
          <h2>
            <Filter size={20} /> Categories
          </h2>
          <ul>
            {CATEGORIES.map((cat) => (
              <li
                key={cat}
                className={selectedCategory === cat ? "active" : ""}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        {/* PRODUCTS GRID */}
        <main className="products">
          {filteredMedicines.length === 0 ? (
            <div className="no-results">
              <Pill size={48} />
              <p>No medicines found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredMedicines.map((medicine) => {
              const inCart = cart.find((i) => i.id === medicine.id);
              const IconComponent = medicine.icon;
              return (
                <div key={medicine.id} className="product-card">
                  <div className="product-icon">
                    <IconComponent size={40} />
                  </div>
                  <span className="category-badge">{medicine.category}</span>
                  <h3>{medicine.name}</h3>
                  <p className="price">₹{medicine.price}</p>

                  {/* FIX: Show qty controls once item is in cart */}
                  {inCart ? (
                    <div className="qty-controls">
                      <button onClick={() => decreaseQty(medicine.id)}>−</button>
                      <span>{inCart.quantity}</span>
                      <button onClick={() => increaseQty(medicine.id)}>+</button>
                    </div>
                  ) : (
                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(medicine)}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              );
            })
          )}
        </main>

        {/* CART SIDEBAR */}
        <aside className="cart">
          <h2>
            <ShoppingCart size={20} /> Cart
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </h2>

          {cart.length === 0 ? (
            <p className="cart-empty">Your cart is empty</p>
          ) : (
            <>
              <ul>
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <span className="item-name">{item.name}</span>

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
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="cart-total">
                <strong>Total: ₹{cartTotal}</strong>
              </p>

              <button className="checkout-btn" onClick={handleCheckout}>
                {isLoggedIn ? "Checkout →" : "Login to Checkout →"}
              </button>

              <button className="clear-cart-btn" onClick={clearCart}>
                <X size={16} /> Clear Cart
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MedStore;