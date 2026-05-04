const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const Feedback = require('../models/Feedback');
const roleCheck = require('../middleware/roleCheck');

// ─── HOSPITAL MANAGEMENT ─────────────────────────────────────────────────────

// Get all hospitals (admin only)
router.get('/hospitals', auth, roleCheck('admin'), async (req, res) => {
  try {
    const hospitals = await Hospital.find().select('-password').sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Accept or reject a hospital (admin only)
router.put('/hospitals/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { accepted } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { accepted },
      { new: true }
    ).select('-password');
    if (!hospital) return res.status(404).json({ msg: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a hospital (admin only)
router.delete('/hospitals/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) return res.status(404).json({ msg: 'Hospital not found' });
    res.json({ msg: 'Hospital removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── ACTIVITY LOG (recent actions on hospitals) ───────────────────────────────

// Get activity summary: recent registrations, approvals
router.get('/activity', auth, roleCheck('admin'), async (req, res) => {
  try {
    const recentHospitals = await Hospital.find()
      .select('hospitalName accepted city createdAt updatedAt adminName')
      .sort({ updatedAt: -1 })
      .limit(20);

    const activity = recentHospitals.map(h => ({
      id: h._id,
      hospitalName: h.hospitalName,
      city: h.city,
      adminName: h.adminName,
      status: h.accepted ? 'Approved' : 'Pending',
      registeredAt: h.createdAt,
      updatedAt: h.updatedAt
    }));

    res.json(activity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── USERS MANAGEMENT ────────────────────────────────────────────────────────

// Get all registered users (admin only)
router.get('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── ORDERS MANAGEMENT ───────────────────────────────────────────────────────

// Get all orders (admin only)
router.get('/orders', auth, roleCheck('admin'), async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update order status (admin only)
router.patch('/orders/:id/status', auth, roleCheck('admin'), async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { orderStatus } = req.body;
    const allowed = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    ).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── FEEDBACK MANAGEMENT ─────────────────────────────────────────────────────

// Public: Submit feedback
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, rating, category, message } = req.body;
    if (!name || !email || !rating || !message) {
      return res.status(400).json({ message: 'Name, email, rating and message are required' });
    }
    const feedback = new Feedback({ name, email, rating, category, message });
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Admin: Get all feedback
router.get('/feedback', auth, roleCheck('admin'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Admin: Update feedback status / reply
router.put('/feedback/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status, adminReply },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ msg: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Admin: Delete feedback
router.delete('/feedback/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Feedback deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;