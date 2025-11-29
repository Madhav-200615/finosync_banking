const { mongoose } = require("../config/mongo");

const cardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    name: { type: String, required: true }, // e.g., "Platinum Rewards", "Savings Debit"
    cardNumber: { type: String, required: true }, // Full card number (encrypted in production)
    last4: { type: String, required: true }, // Last 4 digits for display
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    cvv: { type: String, required: true }, // Encrypted in production
    status: { type: String, enum: ["active", "blocked", "inactive"], default: "active" },

    // Credit card specific
    limit: { type: Number, default: 0 }, // Credit limit
    used: { type: Number, default: 0 }, // Amount used
    due: { type: Number, default: 0 }, // Bill due amount
    dueDate: { type: String }, // Due date for payment
    minDue: { type: Number, default: 0 }, // Minimum amount due

    // Debit card specific
    linkedAccount: { type: String }, // Account number linked to debit card
    dailyLimit: { type: Number, default: 50000 }, // Daily withdrawal/spending limit

    // Common
    cardholderName: { type: String, required: true },
    brand: { type: String, enum: ["Visa", "Mastercard", "RuPay", "AmEx"], default: "Visa" },
    color: { type: String, default: "blue" } // For UI customization
  },
  { timestamps: true }
);

// Virtual for available credit
cardSchema.virtual("available").get(function () {
  if (this.type === "credit") {
    return this.limit - this.used;
  }
  return 0;
});

// Virtual for utilization percentage
cardSchema.virtual("utilization").get(function () {
  if (this.type === "credit" && this.limit > 0) {
    return Math.round((this.used / this.limit) * 100);
  }
  return 0;
});

cardSchema.set("toJSON", { virtuals: true });
cardSchema.set("toObject", { virtuals: true });

const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
