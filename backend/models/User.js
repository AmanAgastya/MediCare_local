const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  testDate: { type: Date, required: true },
  labName: { type: String },
  result: { type: String },
  notes: { type: String },
  reportUrl: { type: String }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  role:  { type: String, required: true, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  // Medical Profile
  bloodGroup:    { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'], default: 'Unknown' },
  dateOfBirth:   { type: Date },
  gender:        { type: String, enum: ['Male','Female','Other',''] },
  address:       { type: String, trim: true },
  allergies:     [{ type: String, trim: true }],
  chronicConditions: [{ type: String, trim: true }],
  currentMedications:[{ type: String, trim: true }],
  emergencyContact: {
    name:  { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  labTests: [labTestSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);