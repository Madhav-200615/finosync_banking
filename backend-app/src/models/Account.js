// backend-app/src/models/Account.js

const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["SAVINGS", "CURRENT", "WALLET"],
    required: true
  },

  accountNumber: {
    type: String,
    required: true,
    unique: true
  },

  balance: {
    type: Number,
    default: 0
  },

  // ONLY FOR CURRENT ACCOUNT
  businessName: { type: String, default: null },
  gstNo: { type: String, default: null },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Account", AccountSchema);
