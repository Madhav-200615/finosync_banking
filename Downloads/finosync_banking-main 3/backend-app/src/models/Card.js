const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },
    name: { type: String, required: true },
    cardNumber: { type: String, required: true },
    last4: { type: String, required: true },
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    cvv: { type: String, required: true },
    cardholderName: { type: String, required: true },
    brand: {
      type: String,
      enum: ["Visa", "Mastercard", "RuPay", "AmEx"],
      default: "Visa"
    },
    color: { type: String, default: "blue" },
    status: {
      type: String,
      enum: ["active", "blocked", "expired"],
      default: "active"
    },

    // Credit card specific fields
    limit: { type: Number },
    used: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    minDue: { type: Number, default: 0 },
    dueDate: { type: String },

    // Debit card specific fields
    linkedAccount: { type: String },
    dailyLimit: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
