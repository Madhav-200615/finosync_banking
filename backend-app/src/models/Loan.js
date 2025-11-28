// models/Loan.js
const mongoose = require("mongoose");

const LOAN_TYPES = [
  "HOME",
  "GOLD",
  "PROPERTY",
  "PERSONAL",
  "VEHICLE",
  "EDUCATION",
];

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    loanType: {
      type: String,
      enum: LOAN_TYPES,
      required: true,
    },

    principalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    interestRate: {
      // per annum in %
      type: Number,
      required: true,
      min: 0,
    },

    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },

    collateralDetails: {
      type: String,
      default: null,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    // calculated at creation
    emiAmount: {
      type: Number,
      required: true,
    },

    totalInterestPayable: {
      type: Number,
      required: true,
    },

    totalPayableAmount: {
      type: Number,
      required: true,
    },

    // tracking
    remainingPrincipal: {
      type: Number,
      required: true,
    },

    paidEmiCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED", "OVERDUE"],
      default: "ACTIVE",
    },

    // simple repayment history
    repayments: [
      {
        paidOn: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        principalComponent: { type: Number, required: true },
        interestComponent: { type: Number, required: true },
        remainingPrincipalAfterPayment: { type: Number, required: true },
      },
    ],

    // for pre-closure
    preclosurePenaltyPercent: {
      type: Number,
      default: 2, // 2%
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
module.exports.LOAN_TYPES = LOAN_TYPES;
