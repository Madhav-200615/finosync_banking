const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  age: {
    type: Number,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
  },

  aadhar: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{12}$/, 'Please enter a valid 12-digit Aadhar number'],
  },

  pan: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number'],
  },

  // 6 digit account number for login + transfer
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },

  // hashed PIN
  pinHash: {
    type: String,
    required: true,
  },

  // For OTP-based forgot PIN
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compare PIN
UserSchema.methods.verifyPin = function (pin) {
  return bcrypt.compare(pin, this.pinHash);
};

module.exports = mongoose.model("User", UserSchema);
