const mongoose = require('mongoose');

const testSuggestionSchema = new mongoose.Schema({
  testName:    { type: String, required: true },
  reason:      { type: String },
  urgency:     { type: String, enum: ['Routine', 'Urgent', 'Emergency'], default: 'Routine' },
  suggestedAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
  fullName:       { type: String, required: true },
  email:          { type: String, required: true },
  phoneNumber:    { type: String, required: true },
  date:           { type: Date, required: true },
  time:           { type: String, required: true },
  state:          { type: String, required: true },
  city:           { type: String, required: true },
  hospital:       { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  doctor: {
    id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    name: { type: String, required: true }
  },
  additionalMessage: { type: String },

  // ── Status now includes Running and Done for doctor workflow ──
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Accepted', 'Running', 'Done', 'Denied', 'Cancelled']
  },

  bedAllocated:   { type: Boolean, default: false },
  queueToken:     { type: Number, default: null },
  notified:       { type: Boolean, default: false },
  needsBed:       { type: Boolean, default: false },

  // ── Doctor's report (written after consultation) ──
  doctorReport: {
    diagnosis:       { type: String },
    prescription:    { type: String },
    notes:           { type: String },
    followUpDate:    { type: Date },
    reportWrittenAt: { type: Date }
  },

  // ── Test suggestions by doctor ──
  testSuggestions: [testSuggestionSchema]

}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);