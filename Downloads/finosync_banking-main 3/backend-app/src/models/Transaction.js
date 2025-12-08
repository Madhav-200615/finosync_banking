// backend-app/models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT", "EMI"], required: true },
    category: { type: String, default: "GENERAL" },  // e.g. FOOD, RENT, SHOPPING
    description: { type: String },
    balanceAfter: { type: Number },                  // optional
  },
  { timestamps: true }                               // createdAt, updatedAt
);

module.exports = mongoose.model("Transaction", transactionSchema);
