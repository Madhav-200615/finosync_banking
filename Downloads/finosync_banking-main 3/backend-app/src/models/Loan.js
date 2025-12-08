const mongoose = require("mongoose");

const RepaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  interestComponent: { type: Number, required: true },
  principalComponent: { type: Number, required: true },
  remainingPrincipalAfterPayment: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now }
});

const LoanSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    loanType: {
      type: String,
      enum: ["Personal", "Home", "Education", "Vehicle", "Business"],
      required: true
    },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    collateralDetails: { type: String, default: null },

    emiAmount: { type: Number, required: true },
    totalInterestPayable: { type: Number, required: true },
    totalPayableAmount: { type: Number, required: true },
    remainingPrincipal: { type: Number, required: true },

    paidEmiCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "CLOSED", "DEFAULTED", "REJECTED"],
      default: "PENDING",
    },

    preclosurePenaltyPercent: { type: Number, default: 2 },

    repayments: [RepaymentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", LoanSchema);
