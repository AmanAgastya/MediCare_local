const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Donation  = require('../models/Donation');
const Hospital  = require('../models/Hospital');

// ─── Helper: silently extract JWT payload ─────────────────────────────────
function extractJwt(req) {
  try {
    const jwt    = require('jsonwebtoken');
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      if (decoded?.user) return { id: decoded.user.id, email: decoded.user.email || '' };
    }
  } catch (_) {}
  return { id: null, email: '' };
}

// ═══════════════════════════════════════════════════════════════════════════
//  HOSPITAL — raise a donation request  (blood / organ / financial)
//  POST /api/donations/hospital-request
// ═══════════════════════════════════════════════════════════════════════════
router.post('/hospital-request', auth, async (req, res) => {
  try {
    const {
      donationType, bloodGroup, unitsRequired,
      organType, patientAge,
      amountRequired, paymentMode, patientName, purpose,
      urgency, notes
    } = req.body;

    if (!donationType) return res.status(400).json({ message: 'donationType is required' });

    const hospital = req.hospital
      ? await Hospital.findById(req.hospital.id).select('-password')
      : null;

    const entry = new Donation({
      requestType:    'hospital_request',
      donationType,
      hospitalId:     hospital?._id    || null,
      hospitalName:   hospital?.hospitalName || req.body.hospitalName || '',
      hospitalCity:   hospital?.city   || '',
      hospitalEmail:  hospital?.email  || '',
      hospitalPhone:  hospital?.phone  || '',
      bloodGroup:     bloodGroup  || '',
      unitsRequired:  unitsRequired || 1,
      organType:      organType   || '',
      patientAge:     patientAge  || 0,
      amountRequired: amountRequired || 0,
      paymentMode:    paymentMode || '',
      patientName:    patientName || '',
      purpose:        purpose || '',
      urgency:        urgency || 'normal',
      notes:          notes   || '',
    });

    await entry.save();
    res.status(201).json({ message: 'Donation request submitted successfully', donation: entry });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  USER/DONOR — raise a donor offer  (blood / organ / financial)
//  POST /api/donations/donor-offer
//  Works with OR without login — if logged in, userId + email captured from JWT
// ═══════════════════════════════════════════════════════════════════════════
router.post('/donor-offer', async (req, res) => {
  // Try to auto-fill userId/email from JWT (token is optional for this route)
  const jwt = extractJwt(req);

  try {
    const {
      donationType,
      donorName, donorEmail, donorPhone, donorAddress, donorAge, donorGender,
      bloodGroup, unitsOffered,
      organType, donorAlive,
      amountOffered, amountRequired, paymentMode, patientName, purpose,
      urgency, notes,
    } = req.body;

    if (!donationType) return res.status(400).json({ message: 'donationType is required' });
    if (!donorName)    return res.status(400).json({ message: 'donorName is required' });

    const resolvedEmail = donorEmail || jwt.email || '';
    if (!donorPhone && !resolvedEmail) {
      return res.status(400).json({ message: 'Phone or email required' });
    }

    const entry = new Donation({
      requestType:    'donor_offer',
      donationType,
      donorName,
      donorEmail:     resolvedEmail,
      donorPhone:     donorPhone   || '',
      donorAddress:   donorAddress || '',
      donorAge:       donorAge     || 0,
      donorGender:    donorGender  || '',
      userId:         jwt.id       || null,
      bloodGroup:     bloodGroup   || '',
      unitsOffered:   unitsOffered || 1,
      organType:      organType    || '',
      donorAlive:     donorAlive !== undefined ? donorAlive : true,
      amountOffered:  amountOffered  || 0,
      amountRequired: amountRequired || 0,
      paymentMode:    paymentMode    || '',
      patientName:    patientName    || '',
      purpose:        purpose        || '',
      urgency:        urgency || 'normal',
      notes:          notes   || '',
    });

    await entry.save();
    res.status(201).json({
      message: 'Donor offer submitted successfully. Our admin will contact you soon.',
      donation: entry,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC — list approved hospital requests (for donors to browse)
//  GET /api/donations/hospital-requests/public
// ═══════════════════════════════════════════════════════════════════════════
router.get('/hospital-requests/public', async (req, res) => {
  try {
    const requests = await Donation.find({
      requestType: 'hospital_request',
      status:      { $in: ['approved', 'matched'] },
    })
      .select('-adminNote -reviewedBy')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  USER — get current user's own donation history
//  GET /api/donations/my-donations?type=blood|organ|financial
//  Requires login (Bearer token)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/my-donations', auth, async (req, res) => {
  try {
    const filter = {
      $or: [
        { userId:     req.user.id    },
        { donorEmail: req.user.email },
      ],
    };
    if (req.query.type) filter.donationType = req.query.type;
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN — get all donations with optional filters
//  GET /api/donations/admin/all?type=blood&requestType=donor_offer&status=pending
// ═══════════════════════════════════════════════════════════════════════════
router.get('/admin/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)        filter.donationType = req.query.type;
    if (req.query.requestType) filter.requestType  = req.query.requestType;
    if (req.query.status)      filter.status       = req.query.status;
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN — dashboard stats
//  GET /api/donations/admin/stats
// ═══════════════════════════════════════════════════════════════════════════
router.get('/admin/stats', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [
      totalRequests, totalOffers,
      pendingRequests, pendingOffers,
      bloodReq, organReq, finReq,
      bloodOff, organOff, finOff,
      matched, fulfilled,
    ] = await Promise.all([
      Donation.countDocuments({ requestType: 'hospital_request' }),
      Donation.countDocuments({ requestType: 'donor_offer' }),
      Donation.countDocuments({ requestType: 'hospital_request', status: 'pending' }),
      Donation.countDocuments({ requestType: 'donor_offer',      status: 'pending' }),
      Donation.countDocuments({ requestType: 'hospital_request', donationType: 'blood' }),
      Donation.countDocuments({ requestType: 'hospital_request', donationType: 'organ' }),
      Donation.countDocuments({ requestType: 'hospital_request', donationType: 'financial' }),
      Donation.countDocuments({ requestType: 'donor_offer', donationType: 'blood' }),
      Donation.countDocuments({ requestType: 'donor_offer', donationType: 'organ' }),
      Donation.countDocuments({ requestType: 'donor_offer', donationType: 'financial' }),
      Donation.countDocuments({ status: 'matched' }),
      Donation.countDocuments({ status: 'fulfilled' }),
    ]);
    res.json({
      totalRequests, totalOffers,
      pendingRequests, pendingOffers,
      byType: {
        blood:     { requests: bloodReq, offers: bloodOff },
        organ:     { requests: organReq, offers: organOff },
        financial: { requests: finReq,   offers: finOff   },
      },
      matched, fulfilled,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN — approve / reject / match / fulfill / note a donation
//  PUT /api/donations/admin/:id
// ═══════════════════════════════════════════════════════════════════════════
router.put('/admin/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { status, adminNote, matchedWith } = req.body;
    const update = {};
    if (status    !== undefined) update.status    = status;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (matchedWith)             update.matchedWith = matchedWith;
    update.reviewedAt = new Date();
    update.reviewedBy = req.user?.email || 'admin';

    const donation = await Donation.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!donation) return res.status(404).json({ msg: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN — delete a donation entry
//  DELETE /api/donations/admin/:id
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/admin/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Donation entry removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;