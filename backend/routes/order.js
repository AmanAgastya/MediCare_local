// backend/routes/order.js
// FIXES:
//  1. SECURITY BUG: GET /all (admin all orders) had NO auth middleware —
//     anyone could hit it and get all user orders with full PII
//  2. Missing try/catch on GET /my-orders and GET /all — unhandled rejections
//     would crash the server process
//  3. paymentMethod field was not passed through from frontend (Payment.js
//     sends it but the route was discarding it) — now saved to order
//  4. Added orderStatus update route for admin dashboard

const express     = require("express");
const router      = express.Router();
const Order       = require("../models/Order");
const auth        = require("../middleware/auth");
const roleCheck   = require("../middleware/roleCheck");

// ── POST /api/order/create ────────────────────────────────────────────────────
// Create a new order (authenticated user only)
router.post("/create", auth, async (req, res) => {
  try {
    const { items, totalAmount, address, paymentMethod, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }

    const order = new Order({
      user:          req.user.id,
      items,
      totalAmount,
      address,
      paymentMethod: paymentMethod || "card",  // FIX: was being discarded
      paymentStatus: paymentStatus  || "Paid",
      orderStatus:   "Placed",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ message: "Server error while creating order" });
  }
});

// ── GET /api/order/my-orders ─────────────────────────────────────────────────
// Get orders for the logged-in user
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch my-orders error:", err.message);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
});

// ── GET /api/order/all ───────────────────────────────────────────────────────
// FIX: was public (no middleware) — now requires admin role
router.get("/all", auth, roleCheck(["admin", "super_admin"]), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")  // Only expose needed fields
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch all orders error:", err.message);
    res.status(500).json({ message: "Server error while fetching all orders" });
  }
});

// ── PATCH /api/order/:id/status ──────────────────────────────────────────────
// FIX: Admin dashboard needs to update order status — route was missing entirely
router.patch(
  "/:id/status",
  auth,
  roleCheck(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const { orderStatus } = req.body;
      const allowed = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];
      if (!allowed.includes(orderStatus)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { orderStatus },
        { new: true }
      );

      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      console.error("Update order status error:", err.message);
      res.status(500).json({ message: "Server error while updating status" });
    }
  }
);

module.exports = router;