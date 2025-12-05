const mongoose = require("mongoose");

const FDSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },

    amount: { type: Number, required: true },          // principal
    tenureMonths: { type: Number, default: 12 },       // for now fixed 12
    interestRate: { type: Number, default: 0.07 },     // 7%

    startDate: { type: Date, default: Date.now },
    maturityDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active"
    },

    // On closure:
    closedAt: { type: Date },
    interestEarned: { type: Number, default: 0 },
    closingAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FD", FDSchema);
