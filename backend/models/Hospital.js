const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  tokenNumber:   { type: Number, required: true },
  patientName:   { type: String, required: true },
  patientPhone:  { type: String },
  doctorName:    { type: String, required: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId },  // track which doctor sub-doc
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  queueDate:     { type: String, required: true, default: () => new Date().toISOString().slice(0, 10) },  // "YYYY-MM-DD" — token scope
  status: { type: String, enum: ['Waiting', 'In Progress', 'Done', 'Skipped'], default: 'Waiting' },
  addedAt: { type: Date, default: Date.now }
});

// ── Per-doctor, per-date token counter ────────────────────────────────────────
// key: "<doctorId>_<YYYY-MM-DD>"  value: last issued token number
const doctorTokenCounterSchema = new mongoose.Schema({
  key:         { type: String, required: true },  // "<doctorId>_<YYYY-MM-DD>"
  lastToken:   { type: Number, default: 0 }
}, { _id: false });

const doctorSubSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  specialization: { type: String, required: true },
  username:       { type: String },
  password:       { type: String },
  canLogin:       { type: Boolean, default: false }
});

const hospitalSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:     { type: String, required: true },
  phone:        { type: String, required: true, trim: true },
  address:      { type: String, required: true, trim: true },
  state:        { type: String, required: true },
  city:         { type: String, required: true },
  doctors:      [doctorSubSchema],
  adminName:    { type: String, required: true, trim: true },
  accepted:     { type: Boolean, default: false },
  totalPatients:      { type: Number, default: 0 },
  appointmentsToday:  { type: Number, default: 0 },
  availableBeds:      { type: Number, default: 0 },
  totalBeds:          { type: Number, default: 0 },
  doctorsOnDuty:      { type: Number, default: 0 },
  queue:              [queueEntrySchema],

  // ── Replaced flat nextTokenNumber with per-doctor-per-date counters ──
  // Legacy field kept for backward compatibility (unused for new tokens)
  nextTokenNumber:    { type: Number, default: 1 },
  doctorTokenCounters: [doctorTokenCounterSchema]

}, { timestamps: true });

// ── Helper: get next token for a specific doctor on a specific date ────────────
hospitalSchema.methods.getNextDoctorToken = function(doctorId, dateStr) {
  const key = `${doctorId}_${dateStr}`;
  let counter = this.doctorTokenCounters.find(c => c.key === key);
  if (!counter) {
    // First token of the day for this doctor → start at 1
    this.doctorTokenCounters.push({ key, lastToken: 1 });
    return 1;
  }
  counter.lastToken += 1;
  return counter.lastToken;
};

module.exports = mongoose.model('Hospital', hospitalSchema);