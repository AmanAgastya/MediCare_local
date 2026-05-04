const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Hospital = require("../models/Hospital");
const Appointment = require('../models/Appointment');
const auth = require("../middleware/auth");

const router = express.Router();

// ─── Hospital Signup (NO auth required — hospital doesn't have a token yet) ───
router.post("/signup", async (req, res) => {
  try {
    const { hospitalName, email, password, phone, address, state, city, adminName } = req.body;

    let hospital = await Hospital.findOne({ email });
    if (hospital) {
      return res.status(400).json({ message: "Hospital already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    hospital = new Hospital({
      hospitalName,
      email,
      password: hashedPassword,
      phone,
      address,
      state,
      city,
      adminName,
      accepted: false,
    });

    await hospital.save();

    const payload = { hospital: { id: hospital.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err;
      res.json({ token, hospitalName: hospital.hospitalName, accepted: hospital.accepted });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Hospital Login (NO auth required) ───────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let hospital = await Hospital.findOne({ email });
    if (!hospital) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = { hospital: { id: hospital.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        hospitalName: hospital.hospitalName,
        accepted: hospital.accepted
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Hospital Dashboard ───────────────────────────────────────────────────────
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const hospital = await Hospital.findById(req.hospital.id).select("-password");
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }
    res.json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Update Hospital Stats ────────────────────────────────────────────────────
router.put("/update-stats", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { totalPatients, appointmentsToday, availableBeds, totalBeds, doctorsOnDuty } = req.body;

    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });

    if (totalPatients !== undefined) hospital.totalPatients = totalPatients;
    if (appointmentsToday !== undefined) hospital.appointmentsToday = appointmentsToday;
    if (availableBeds !== undefined) hospital.availableBeds = availableBeds;
    if (totalBeds !== undefined) hospital.totalBeds = totalBeds;
    if (doctorsOnDuty !== undefined) hospital.doctorsOnDuty = doctorsOnDuty;

    await hospital.save();
    res.json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Add Doctor ───────────────────────────────────────────────────────────────
router.post("/add-doctor", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { name, specialization } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ message: "Name and specialization are required" });
    }

    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    hospital.doctors.push({ name, specialization });
    await hospital.save();
    res.status(201).json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Remove Doctor ────────────────────────────────────────────────────────────
router.delete("/remove-doctor/:doctorId", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    hospital.doctors = hospital.doctors.filter(
      d => d._id.toString() !== req.params.doctorId
    );
    await hospital.save();
    res.json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Get Hospitals by City (public — no auth) ─────────────────────────────────
router.get('/hospitals/:city', async (req, res) => {
  try {
    const city = req.params.city.trim();
    const hospitals = await Hospital.find({
      city: { $regex: new RegExp(`^${city}$`, 'i') },
      accepted: true   // Only return admin-approved hospitals
    }).select('-password -queue');
    res.json(hospitals);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Get All Accepted Hospitals (public) ─────────────────────────────────────
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ accepted: true }).select('-password -queue');
    res.json(hospitals);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Get Doctors by Hospital (public — no auth) ───────────────────────────────
router.get("/doctors/:hospitalId", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
    res.json(hospital.doctors || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Get Bed Availability for a Hospital (public) ────────────────────────────
router.get("/bed-availability/:hospitalId", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId).select(
      'hospitalName availableBeds totalBeds city state address'
    );
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
    res.json({
      hospitalName: hospital.hospitalName,
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds,
      occupiedBeds: hospital.totalBeds - hospital.availableBeds,
      city: hospital.city,
      state: hospital.state,
      address: hospital.address
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Book Appointment (requires user auth) ────────────────────────────────────
router.post("/book-appointment/:hospitalId", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please log in to book an appointment" });
    }
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    if (!hospital.accepted) {
      return res.status(400).json({ message: "This hospital is not yet approved" });
    }

    const appointment = new Appointment({
      ...req.body,
      hospital: hospital._id
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ─── Get Appointments for Hospital ───────────────────────────────────────────
router.get("/appointments", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const appointments = await Appointment.find({ hospital: req.hospital.id })
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Accept / Deny Appointment (with FCFS queue token + bed allocation) ───────
router.put("/appointments/:id/:action", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { id, action } = req.params;
    const { allocateBed } = req.body;
    const appointment = await Appointment.findById(id);

    if (!appointment) return res.status(404).json({ msg: "Appointment not found" });
    if (appointment.hospital.toString() !== req.hospital.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const hospital = await Hospital.findById(req.hospital.id);

    if (action === 'accept') {
      appointment.status = 'Accepted';

      // Auto-issue FCFS queue token
      const tokenNumber = hospital.nextTokenNumber;
      const todayDate = new Date().toISOString().slice(0, 10);
      hospital.queue.push({
        tokenNumber,
        patientName: appointment.fullName,
        patientPhone: appointment.phoneNumber,
        doctorName: appointment.doctor.name,
        queueDate: todayDate,
        status: 'Waiting',
        appointmentId: appointment._id
      });
      hospital.nextTokenNumber += 1;
      appointment.queueToken = tokenNumber;

      // Bed allocation if requested and beds available
      if ((allocateBed || appointment.needsBed) && hospital.availableBeds > 0) {
        hospital.availableBeds = Math.max(0, hospital.availableBeds - 1);
        appointment.bedAllocated = true;
      }
      appointment.notified = false; // reset so user sees new notification
      await hospital.save();

    } else if (action === 'deny') {
      appointment.status = 'Denied';
      // If was previously accepted with bed, free it
      if (appointment.bedAllocated) {
        hospital.availableBeds = Math.min(hospital.totalBeds, hospital.availableBeds + 1);
        appointment.bedAllocated = false;
        await hospital.save();
      }
    } else {
      return res.status(400).json({ msg: "Invalid action. Use 'accept' or 'deny'" });
    }

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Edit Doctor Credentials ──────────────────────────────────────────────────
router.put("/update-doctor/:doctorId", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const doctor = hospital.doctors.id(req.params.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const { name, specialization, username, password, canLogin } = req.body;
    if (name) doctor.name = name;
    if (specialization) doctor.specialization = specialization;
    if (canLogin !== undefined) doctor.canLogin = canLogin;

    if (username) {
      // Check uniqueness (except self)
      const conflict = hospital.doctors.find(d => d.username === username && d._id.toString() !== req.params.doctorId);
      if (conflict) return res.status(400).json({ message: "Username already taken" });
      doctor.username = username;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(password, salt);
    }

    await hospital.save();
    res.json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── QUEUE MANAGEMENT ─────────────────────────────────────────────────────────

// Get Queue (public)
router.get("/queue/:hospitalId", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId).select(
      'hospitalName queue nextTokenNumber'
    );
    if (!hospital) return res.status(404).json({ msg: "Hospital not found" });
    res.json({
      hospitalName: hospital.hospitalName,
      queue: hospital.queue,
      nextTokenNumber: hospital.nextTokenNumber
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Add patient to queue (hospital auth)
router.post("/queue/add", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { patientName, patientPhone, doctorName } = req.body;
    if (!patientName || !doctorName) {
      return res.status(400).json({ message: "Patient name and doctor name are required" });
    }

    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const tokenNumber = hospital.nextTokenNumber;
    const todayDate = new Date().toISOString().slice(0, 10);
    hospital.queue.push({ tokenNumber, patientName, patientPhone, doctorName, queueDate: todayDate, status: 'Waiting' });
    hospital.nextTokenNumber += 1;

    await hospital.save();
    res.status(201).json({ tokenNumber, queue: hospital.queue });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update queue entry status (hospital auth)
router.put("/queue/:entryId", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { status } = req.body;
    const validStatuses = ['Waiting', 'In Progress', 'Done', 'Skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const entry = hospital.queue.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Queue entry not found" });

    entry.status = status;
    await hospital.save();
    res.json({ queue: hospital.queue });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Remove entry from queue (hospital auth)
router.delete("/queue/:entryId", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    hospital.queue = hospital.queue.filter(
      e => e._id.toString() !== req.params.entryId
    );
    await hospital.save();
    res.json({ queue: hospital.queue });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Clear completed/skipped queue entries (hospital auth)
router.delete("/queue-clear", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    hospital.queue = hospital.queue.filter(e => !['Done', 'Skipped'].includes(e.status));
    await hospital.save();
    res.json({ queue: hospital.queue });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Add Doctor with Login Credentials ───────────────────────────────────────
router.post("/add-doctor-with-login", auth, async (req, res) => {
  try {
    if (!req.hospital || !req.hospital.id) {
      return res.status(401).json({ message: "Not authorized as a hospital" });
    }
    const { name, specialization, username, password } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ message: "Name and specialization are required" });
    }

    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    let doctorData = { name, specialization, canLogin: false };

    if (username && password) {
      // Check username unique within hospital
      const exists = hospital.doctors.find(d => d.username === username);
      if (exists) return res.status(400).json({ message: "Username already taken in this hospital" });
      const salt = await bcrypt.genSalt(10);
      doctorData.username = username;
      doctorData.password = await bcrypt.hash(password, salt);
      doctorData.canLogin = true;
    }

    hospital.doctors.push(doctorData);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Doctor Login ─────────────────────────────────────────────────────────────
router.post("/doctor-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find hospital that has this doctor
    const hospitals = await Hospital.find({ 'doctors.username': username, accepted: true });
    if (!hospitals || hospitals.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    let foundDoctor = null;
    let foundHospital = null;

    for (const hospital of hospitals) {
      const doctor = hospital.doctors.find(d => d.username === username && d.canLogin);
      if (doctor) {
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (isMatch) {
          foundDoctor = doctor;
          foundHospital = hospital;
          break;
        }
      }
    }

    if (!foundDoctor || !foundHospital) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwt = require('jsonwebtoken');
    const payload = {
      doctor: {
        id: foundDoctor._id,
        hospitalId: foundHospital._id,
        name: foundDoctor.name,
        specialization: foundDoctor.specialization
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        doctorName: foundDoctor.name,
        specialization: foundDoctor.specialization,
        hospitalName: foundHospital.hospitalName,
        hospitalId: foundHospital._id
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Doctor Dashboard ─────────────────────────────────────────────────────────
router.get("/doctor/dashboard", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const { hospitalId, name: doctorName } = req.doctor;
    const today = new Date().toISOString().slice(0, 10);

    const hospital = await Hospital.findById(hospitalId).select("-password");
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    // Filter today's queue entries for this doctor by addedAt date
    const myQueue = hospital.queue.filter(e => {
      const entryDate = e.addedAt ? new Date(e.addedAt).toISOString().slice(0, 10) : null;
      return e.doctorName === doctorName && entryDate === today;
    });

    const appointments = await Appointment.find({
      hospital: hospitalId,
      "doctor.name": doctorName
    }).sort({ date: 1, time: 1 });

    res.json({
      doctorName,
      specialization: req.doctor.specialization,
      hospitalName: hospital.hospitalName,
      todayQueue: myQueue,
      appointments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Doctor: get own appointments (optionally filter by ?date=YYYY-MM-DD)
router.get("/doctor/appointments", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const { hospitalId, name: doctorName } = req.doctor;
    const query = { hospital: hospitalId, "doctor.name": doctorName };

    if (req.query.date) {
      const start = new Date(req.query.date);
      const end   = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      query.date  = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Doctor updates appointment status → "Running" or "Done"
router.put("/doctor/appointments/:id/status", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const { status } = req.body;
    if (!["Running", "Done"].includes(status)) {
      return res.status(400).json({ message: 'Status must be "Running" or "Done"' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.hospital.toString() !== req.doctor.hospitalId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    appointment.status = status;

    if (status === "Done") {
      const hospital = await Hospital.findById(req.doctor.hospitalId);
      if (hospital) {
        const entry = hospital.queue.find(
          e => e.appointmentId && e.appointmentId.toString() === appointment._id.toString()
        );
        if (entry) { entry.status = "Done"; await hospital.save(); }
      }
    }

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Doctor writes/updates consultation report
router.put("/doctor/appointments/:id/report", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const { diagnosis, prescription, notes, followUpDate } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.hospital.toString() !== req.doctor.hospitalId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    appointment.doctorReport = {
      diagnosis:       diagnosis    ?? appointment.doctorReport?.diagnosis,
      prescription:    prescription ?? appointment.doctorReport?.prescription,
      notes:           notes        ?? appointment.doctorReport?.notes,
      followUpDate:    followUpDate ?? appointment.doctorReport?.followUpDate,
      reportWrittenAt: new Date()
    };

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Doctor adds a test suggestion
router.post("/doctor/appointments/:id/tests", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const { testName, reason, urgency } = req.body;
    if (!testName) return res.status(400).json({ message: "Test name is required" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.hospital.toString() !== req.doctor.hospitalId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!appointment.testSuggestions) appointment.testSuggestions = [];
    appointment.testSuggestions.push({ testName, reason, urgency: urgency || "Routine" });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Doctor removes a test suggestion
router.delete("/doctor/appointments/:id/tests/:testId", auth, async (req, res) => {
  try {
    if (!req.doctor) return res.status(401).json({ message: "Not authorized as a doctor" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.hospital.toString() !== req.doctor.hospitalId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    appointment.testSuggestions = (appointment.testSuggestions || []).filter(
      t => t._id.toString() !== req.params.testId
    );
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;