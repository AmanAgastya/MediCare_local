const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

console.log("atlas_URI from script:", process.env.atlas_URI);

mongoose.connect(process.env.atlas_URI)
  .then(() => console.log("MongoDB connected (script)"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function createSuperAdmin() {
  const exists = await User.findOne({ role: "SUPER_ADMIN" });

  if (exists) {
    console.log("Super Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("SuperAdmin@123", 10);

  await User.create({
    name: "Super Admin",
    email: "superadmin@medicare.com",
    phone: "9998885550" ,
    password: hashedPassword,
    role: "super_admin"
  });

  console.log("✅ Super Admin created successfully");
  process.exit();
}

createSuperAdmin();
