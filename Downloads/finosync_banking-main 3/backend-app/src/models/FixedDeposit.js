const mongoose = require("mongoose");

const FixedDepositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    fdId: {
      type: String,
      required: true,
      unique: true,
    },

    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    maturityAmount: { type: Number, required: true },

    tenureMonths: { type: Number, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "CLOSED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FixedDeposit", FixedDepositSchema);
