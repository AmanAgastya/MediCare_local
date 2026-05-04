const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({

  // 'hospital_request' = hospital needs blood/organ/financial
  // 'donor_offer'      = user wants to donate
  requestType: {
    type: String,
    enum: ['hospital_request', 'donor_offer'],
    required: true
  },

  donationType: {
    type: String,
    enum: ['blood', 'organ', 'financial'],
    required: true
  },

  // ── HOSPITAL SIDE ─────────────────────────────────────────────────────────
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  hospitalName: { type: String, trim: true, default: '' },
  hospitalCity: { type: String, trim: true, default: '' },
  hospitalEmail:{ type: String, trim: true, default: '' },
  hospitalPhone:{ type: String, trim: true, default: '' },

  // ── DONOR / USER SIDE ─────────────────────────────────────────────────────
  donorName:    { type: String, trim: true, default: '' },
  donorEmail:   { type: String, trim: true, lowercase: true, default: '' },
  donorPhone:   { type: String, trim: true, default: '' },
  donorAddress: { type: String, trim: true, default: '' },
  donorAge:     { type: Number, default: 0 },
  donorGender:  { type: String, default: '' },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── BLOOD FIELDS ──────────────────────────────────────────────────────────
  bloodGroup: {
    type: String,
    enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Any',''],
    default: ''
  },
  unitsRequired: { type: Number, default: 1 },
  unitsOffered:  { type: Number, default: 1 },

  // ── ORGAN FIELDS ──────────────────────────────────────────────────────────
  organType: {
    type: String,
    enum: ['kidney','liver','heart','lungs','cornea','bone_marrow','pancreas','intestine','other',''],
    default: ''
  },
  donorAlive:    { type: Boolean, default: true },  // true = living donor, false = pledging posthumous
  patientAge:    { type: Number, default: 0 },      // patient needing organ

  // ── FINANCIAL FIELDS ─────────────────────────────────────────────────────
  amountRequired: { type: Number, default: 0 },
  amountOffered:  { type: Number, default: 0 },
  currency:       { type: String, default: 'INR' },
  paymentMode:    { type: String, default: '' },
  patientName:    { type: String, trim: true, default: '' },
  purpose:        { type: String, trim: true, default: '' },

  // ── COMMON ────────────────────────────────────────────────────────────────
  urgency: {
    type: String,
    enum: ['critical', 'high', 'normal'],
    default: 'normal'
  },
  notes: { type: String, trim: true, default: '' },

  // ── ADMIN WORKFLOW ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'matched', 'fulfilled'],
    default: 'pending'
  },
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', default: null },
  adminNote:   { type: String, default: '' },
  reviewedAt:  { type: Date, default: null },
  reviewedBy:  { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);