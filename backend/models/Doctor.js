const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  name: String,
  email: String,
  specialization: String,
  password: String,
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }
});

module.exports = mongoose.model("Doctor", DoctorSchema);
