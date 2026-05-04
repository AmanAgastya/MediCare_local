const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

const router = express.Router();

// ─── Signup ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ name, email, password: hashedPassword, phone });
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, name: user.name });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id, role: user.role, email: user.email } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, name: user.name, role: user.role, email: user.email });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─── Get Profile ──────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      phone, bloodGroup, dateOfBirth, gender, address,
      allergies, chronicConditions, currentMedications, emergencyContact
    } = req.body;

    const update = {};
    if (phone !== undefined) update.phone = phone;
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth;
    if (gender !== undefined) update.gender = gender;
    if (address !== undefined) update.address = address;
    if (allergies !== undefined) update.allergies = allergies;
    if (chronicConditions !== undefined) update.chronicConditions = chronicConditions;
    if (currentMedications !== undefined) update.currentMedications = currentMedications;
    if (emergencyContact !== undefined) update.emergencyContact = emergencyContact;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Get My Appointments ──────────────────────────────────────────────────────
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ email: req.user.email })
      .populate('hospital', 'hospitalName city')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Edit Appointment ─────────────────────────────────────────────────────────
router.put('/my-appointments/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, email: req.user.email });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.status === 'Accepted') return res.status(400).json({ message: 'Cannot edit an accepted appointment' });

    const { date, time, additionalMessage, needsBed } = req.body;
    if (date) appt.date = date;
    if (time) appt.time = time;
    if (additionalMessage !== undefined) appt.additionalMessage = additionalMessage;
    if (needsBed !== undefined) appt.needsBed = needsBed;

    await appt.save();
    res.json(appt);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Cancel/Delete Appointment ────────────────────────────────────────────────
router.delete('/my-appointments/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, email: req.user.email });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.status === 'Accepted' && appt.bedAllocated) {
      // Free up the bed
      await Hospital.findByIdAndUpdate(appt.hospital, { $inc: { availableBeds: 1 } });
    }
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Get Notifications (bed allocation + queue token) ─────────────────────────
router.get('/notifications', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      email: req.user.email,
      $or: [{ bedAllocated: true }, { queueToken: { $ne: null } }]
    }).populate('hospital', 'hospitalName city');
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── Lab Tests ────────────────────────────────────────────────────────────────
router.post('/lab-tests', auth, async (req, res) => {
  try {
    const { testName, testDate, labName, result, notes } = req.body;
    if (!testName || !testDate) return res.status(400).json({ message: 'Test name and date are required' });

    const user = await User.findById(req.user.id);
    user.labTests.push({ testName, testDate, labName, result, notes });
    await user.save();
    res.status(201).json(user.labTests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/lab-tests/:testId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const test = user.labTests.id(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Lab test not found' });
    Object.assign(test, req.body);
    await user.save();
    res.json(user.labTests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/lab-tests/:testId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.labTests = user.labTests.filter(t => t._id.toString() !== req.params.testId);
    await user.save();
    res.json(user.labTests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;