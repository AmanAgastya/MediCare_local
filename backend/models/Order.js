// backend/models/Order.js
// FIXES:
//  1. paymentMethod field was missing from the schema — saving it from the
//     route would silently drop it (Mongoose strips unknown fields by default)
//  2. address was a plain String — Checkout.js saves a full object (name,
//     phone, address, city, state, pincode); changed to a structured sub-schema
//     so individual fields are queryable and properly stored
//  3. Added paymentStatus enum validation (was any String)
//  4. Added orderStatus enum validation with proper values

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

// FIX: was a plain String — now a proper sub-document
const addressSchema = new mongoose.Schema({
  name:    String,
  phone:   String,
  address: String,
  city:    String,
  state:   String,
  pincode: String,
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message:   "Order must contain at least one item",
      },
    },
    totalAmount: {
      type:     Number,
      required: true,
      min:      0,
    },
    // FIX: was String, now structured object
    address: {
      type: addressSchema,
    },
    // FIX: was missing entirely
    paymentMethod: {
      type:    String,
      enum:    ["card", "upi", "cod", "netbanking"],
      default: "card",
    },
    paymentStatus: {
      type:    String,
      enum:    ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type:    String,
      enum:    ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);