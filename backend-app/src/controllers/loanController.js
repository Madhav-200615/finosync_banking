// backend-app/src/controllers/loanController.js
const Loan = require("../models/Loan");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const { calculateEmi } = require("../utils/emiCalculator");
const { redisClient } = require("../config/redis");
const { broadcastLoanUpdate, broadcastTx } = require("../services/ws");
const { logger } = require("../config/logger");

const LOAN_CACHE_TTL = 60; // seconds

// Helper: redis key
function userLoansKey(userId) {
  return `user:${userId}:loans`;
}

// POST /api/loans
exports.applyLoan = async (req, res) => {
  try {
    const {
      loanType,
      principalAmount,
      tenureMonths,
      interestRate,
      collateralDetails,
    } = req.body;

    const userId = req.user.id;

    // 1. Find user's savings account to credit the loan amount
    const account = await Account.findOne({
      user: userId,
      type: { $regex: /^savings$/i }
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Savings account not found to credit loan amount",
      });
    }

    const { emi, totalPayable, totalInterest } = calculateEmi(
      principalAmount,
      interestRate,
      tenureMonths
    );

    const loan = await Loan.create({
      userId,
      loanType,
      principalAmount,
      interestRate,
      tenureMonths,
      collateralDetails: collateralDetails || null,
      emiAmount: Number(emi.toFixed(2)),
      totalInterestPayable: Number(totalInterest.toFixed(2)),
      totalPayableAmount: Number(totalPayable.toFixed(2)),
      remainingPrincipal: Number(principalAmount),
    });

    // 2. Credit the account
    account.balance += principalAmount;
    await account.save();

    // 3. Create Credit Transaction
    const tx = await Transaction.create({
      user: userId,
      amount: principalAmount,
      type: "credit",
      category: "loan_disbursement",
      description: `Loan disbursed: ${loanType} #${loan._id.slice(-6)}`,
    });

    // Broadcast transaction update
    broadcastTx(tx);

    // Invalidate cache
    try {
      await redisClient.del(userLoansKey(userId));
    } catch (e) {
      logger.warn("Failed to clear loans cache", { err: e.toString() });
    }

    // WebSocket notify
    broadcastLoanUpdate({
      type: "LOAN_CREATED",
      userId,
      loanId: loan._id,
      loan,
    });

    return res.status(201).json({
      success: true,
      message: "Loan applied successfully",
      loan,
    });
  } catch (error) {
    logger.error("applyLoan error", { err: error.stack || error.toString() });
    return res.status(500).json({
      success: false,
      message: "Error applying for loan",
    });
  }
};

// GET /api/loans
exports.getAllLoans = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try Redis cache
    try {
      const cached = await redisClient.get(userLoansKey(userId));
      if (cached) {
        const loans = JSON.parse(cached);
        return res.json({ success: true, fromCache: true, loans });
      }
    } catch (e) {
      logger.warn("Loans cache read failed", { err: e.toString() });
    }

    const loans = await Loan.find({ userId }).sort({ createdAt: -1 });

    // Set cache
    try {
      await redisClient.set(
        userLoansKey(userId),
        JSON.stringify(loans),
        { EX: LOAN_CACHE_TTL }
      );
    } catch (e) {
      logger.warn("Loans cache write failed", { err: e.toString() });
    }

    return res.json({ success: true, loans });
  } catch (error) {
    logger.error("getAllLoans error", { err: error.stack || error.toString() });
    return res.status(500).json({
      success: false,
      message: "Error fetching loans",
    });
  }
};

// GET /api/loans/:loanId
exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    return res.json({ success: true, loan });
  } catch (error) {
    logger.error("getLoanDetails error", { err: error.stack || error.toString() });
    return res.status(500).json({
      success: false,
      message: "Error fetching loan details",
    });
  }
};

// POST /api/loans/:loanId/pay-emi
exports.payEmi = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (loan.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "Loan already closed",
      });
    }

    // 1. Find user's savings account to deduct EMI
    const account = await Account.findOne({
      user: userId,
      type: { $regex: /^savings$/i }
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Savings account not found for EMI payment",
      });
    }

    const emi = loan.emiAmount;

    if (account.balance < emi) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in savings account",
      });
    }

    const monthlyRate = loan.interestRate / (12 * 100);
    const interestComponent = loan.remainingPrincipal * monthlyRate;
    const principalComponent = emi - interestComponent;

    loan.remainingPrincipal = Math.max(
      0,
      loan.remainingPrincipal - principalComponent
    );
    loan.paidEmiCount += 1;

    loan.repayments.push({
      amount: emi,
      interestComponent: Number(interestComponent.toFixed(2)),
      principalComponent: Number(principalComponent.toFixed(2)),
      remainingPrincipalAfterPayment: Number(loan.remainingPrincipal.toFixed(2)),
    });

    if (loan.remainingPrincipal <= 1) {
      loan.status = "CLOSED";
      loan.remainingPrincipal = 0;
    }

    await loan.save();

    // 2. Deduct from account
    account.balance -= emi;
    await account.save();

    // 3. Create Debit Transaction
    const tx = await Transaction.create({
      user: userId,
      amount: emi,
      type: "debit",
      category: "loan_repayment",
      description: `EMI Paid: ${loan.loanType} #${loan._id.slice(-6)}`,
    });

    broadcastTx(tx);

    // Invalidate cache
    try {
      await redisClient.del(userLoansKey(userId));
    } catch (e) {
      logger.warn("Failed to clear loans cache after EMI", { err: e.toString() });
    }

    // WebSocket notify
    broadcastLoanUpdate({
      type: "EMI_PAID",
      userId,
      loanId: loan._id,
      emiAmount: emi,
      status: loan.status,
      remainingPrincipal: loan.remainingPrincipal,
    });

    return res.json({
      success: true,
      message: "EMI paid successfully",
      loan,
    });
  } catch (error) {
    logger.error("payEmi error", { err: error.stack || error.toString() });
    return res.status(500).json({
      success: false,
      message: "Error paying EMI",
    });
  }
};

// POST /api/loans/:loanId/preclose
exports.preCloseLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (loan.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "Loan already closed",
      });
    }

    // 1. Find user's savings account
    const account = await Account.findOne({
      user: userId,
      type: { $regex: /^savings$/i }
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Savings account not found for pre-closure",
      });
    }

    const remaining = loan.remainingPrincipal;
    const penalty =
      (loan.preclosurePenaltyPercent / 100) * remaining;
    const totalPayable = remaining + penalty;

    if (account.balance < totalPayable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ₹${totalPayable.toFixed(2)}`,
      });
    }

    loan.status = "CLOSED";
    loan.remainingPrincipal = 0;

    await loan.save();

    // 2. Deduct from account
    account.balance -= totalPayable;
    await account.save();

    // 3. Create Debit Transaction
    const tx = await Transaction.create({
      user: userId,
      amount: totalPayable,
      type: "debit",
      category: "loan_preclosure",
      description: `Loan Pre-closed: ${loan.loanType} #${loan._id.slice(-6)}`,
    });

    broadcastTx(tx);

    // Invalidate cache
    try {
      await redisClient.del(userLoansKey(userId));
    } catch (e) {
      logger.warn("Failed to clear loans cache after preclose", {
        err: e.toString(),
      });
    }

    // WebSocket notify
    broadcastLoanUpdate({
      type: "LOAN_PRECLOSED",
      userId,
      loanId: loan._id,
      totalPayable,
      penalty,
    });

    return res.json({
      success: true,
      message: "Loan pre-closed successfully",
      totalPayable,
      penalty,
    });
  } catch (error) {
    logger.error("preCloseLoan error", { err: error.stack || error.toString() });
    return res.status(500).json({
      success: false,
      message: "Error pre-closing loan",
    });
  }
};
