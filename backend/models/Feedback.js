const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ['general', 'appointment', 'donation', 'telemedicine', 'app', 'other'], default: 'general' },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
  adminReply: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);