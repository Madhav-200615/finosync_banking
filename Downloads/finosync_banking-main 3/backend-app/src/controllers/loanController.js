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

// Helper: compute EMI + derived values
async function createPendingLoan({ userId, loanType, principalNum, tenureNum, rateNum, collateralDetails }) {
  const { emi, totalPayable, totalInterest } = calculateEmi(
    principalNum,
    rateNum,
    tenureNum
  );

  const loan = await Loan.create({
    userId,
    loanType,
    principalAmount: principalNum,
    interestRate: rateNum,
    tenureMonths: tenureNum,
    collateralDetails: collateralDetails || null,
    emiAmount: Number(emi.toFixed(2)),
    totalInterestPayable: Number(totalInterest.toFixed(2)),
    totalPayableAmount: Number(totalPayable.toFixed(2)),
    remainingPrincipal: Number(principalNum),
    status: "PENDING",
  });

  return loan;
}

// POST /api/loans (user applies – creates PENDING loan, no disbursement yet)
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

    // Basic validation & coercion
    const principalNum = Number(principalAmount);
    const tenureNum = Number(tenureMonths);
    // Allow missing interestRate from older frontends by defaulting to 12%
    const rateNum = interestRate !== undefined && interestRate !== null && interestRate !== ''
      ? Number(interestRate)
      : 12;

    if (!loanType || !principalNum || !tenureNum || !rateNum || isNaN(rateNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid loan details provided. Please check amount, tenure and interest rate.",
      });
    }

    let loan;
    try {
      loan = await createPendingLoan({
        userId,
        loanType,
        principalNum,
        tenureNum,
        rateNum,
        collateralDetails,
      });
    } catch (emiErr) {
      logger.error("createPendingLoan error", { err: emiErr.stack || emiErr.toString() });
      return res.status(400).json({
        success: false,
        message: emiErr.message || "Failed to calculate EMI for this loan request",
      });
    }

    // Invalidate cache
    try {
      await redisClient.del(userLoansKey(userId));
    } catch (e) {
      logger.warn("Failed to clear loans cache", { err: e.toString() });
    }

    // WebSocket notify – new loan request
    broadcastLoanUpdate({
      type: "LOAN_REQUESTED",
      userId,
      loanId: loan._id,
      loan,
    });

    return res.status(201).json({
      success: true,
      message: "Loan request submitted. Waiting for admin approval.",
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

// Helper to calculate next due date
function getNextDueDate(loan) {
  const base = new Date(loan.startDate);
  const monthsToAdd = (loan.paidEmiCount || 0) + 1;
  base.setMonth(base.getMonth() + monthsToAdd);
  return base;
}

// GET /api/loans/due-bills
exports.getDueBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await Loan.find({ userId, status: "ACTIVE" });

    const now = new Date();

    const bills = loans.map((loan) => {
      const nextDue = getNextDueDate(loan);

      return {
        loanId: loan._id,
        type: `${loan.loanType} LOAN`,
        amount: loan.emiAmount,
        dueDate: nextDue,
        status: nextDue < now ? "Overdue" : "Pending",
      };
    });

    res.json(bills);
  } catch (err) {
    logger.error("getDueBills error", { err: err.toString() });
    res.status(500).json({ error: "Failed to load loan bills" });
  }
};

// GET /api/loans/:loanId
exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Look up loan purely by ID first, then derive userId from the loan
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const userId = loan.userId;

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
// POST /api/loans/:loanId/pay-emi
exports.payEmi = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    console.log(`[payEmi] Starting EMI payment for loanId: ${loanId}, userId: ${userId}`);

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      console.log(`[payEmi] Loan not found: ${loanId} for user: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (loan.status === "CLOSED") {
      console.log(`[payEmi] Loan already closed: ${loanId}`);
      return res.status(400).json({
        success: false,
        message: "Loan already closed",
      });
    }

    // 1. Find user's account to deduct EMI (Prefer Wallet, then Savings)
    let account = await Account.findOne({
      userId,
      type: { $regex: /^wallet$/i },
    });

    console.log(`[payEmi] Wallet account found:`, account ? account.accountNumber : 'None');

    // If wallet doesn't have enough balance, check savings
    if (!account || account.balance < loan.emiAmount) {
      const savingsAccount = await Account.findOne({
        userId,
        type: { $regex: /^savings$/i },
      });

      console.log(`[payEmi] Savings account found:`, savingsAccount ? savingsAccount.accountNumber : 'None');

      // If savings has enough, use it
      if (savingsAccount && savingsAccount.balance >= loan.emiAmount) {
        account = savingsAccount;
        console.log(`[payEmi] Using savings account for payment: ${account.accountNumber}`);
      }
    }

    if (!account) {
      console.log(`[payEmi] No suitable account found for user: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "No suitable account found for EMI payment",
      });
    }

    const emi = loan.emiAmount;

    if (account.balance < emi) {
      console.log(`[payEmi] Insufficient balance. Account balance: ${account.balance}, EMI: ${emi}`);
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in Wallet/Savings account",
      });
    }

    console.log(`[payEmi] Processing EMI payment of ${emi} from account ${account.accountNumber}`);

    const monthlyRate = loan.interestRate / (12 * 100);
    const interestComponent = loan.remainingPrincipal * monthlyRate;
    const principalComponent = emi - interestComponent;

    console.log(`[payEmi] EMI breakdown - Interest: ${interestComponent.toFixed(2)}, Principal: ${principalComponent.toFixed(2)}`);

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
      console.log(`[payEmi] Loan closed: ${loanId}`);
    }

    await loan.save();
    console.log(`[payEmi] Loan updated successfully`);

    // 2. Deduct from account
    account.balance -= emi;
    await account.save();
    console.log(`[payEmi] Account balance deducted. New balance: ${account.balance}`);

    // 3. Create Debit Transaction
    const tx = await Transaction.create({
      user: userId,
      amount: emi,
      type: "EMI",
      category: "EMI",
      description: `EMI Paid: ${loan.loanType} #${loan._id.slice(-6)}`,
    });

    console.log(`[payEmi] Transaction created: ${tx._id}`);
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

    console.log(`[payEmi] EMI payment completed successfully for loan: ${loanId}`);

    return res.json({
      success: true,
      message: "EMI paid successfully",
      loan,
      referenceId: `EMI-${Date.now()}`
    });
  } catch (error) {
    console.error("[payEmi] EXCEPTION:", error);
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

    const remaining = Number(loan.remainingPrincipal || 0);
    const penalty = (loan.preclosurePenaltyPercent / 100) * remaining;
    const totalPayable = remaining + penalty;

    // 1. Prefer Savings account, then Wallet as fallback
    let account = await Account.findOne({
      userId,
      type: { $regex: /^savings$/i },
    });

    if (!account || account.balance < totalPayable) {
      const walletAccount = await Account.findOne({
        userId,
        type: { $regex: /^wallet$/i },
      });

      if (walletAccount && walletAccount.balance >= totalPayable) {
        account = walletAccount;
      }
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No suitable account (Savings/Wallet) found for pre-closure",
      });
    }

    if (account.balance < totalPayable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ${totalPayable.toFixed(2)}`,
      });
    }

    // 2. Update loan
    loan.status = "CLOSED";
    loan.remainingPrincipal = 0;
    await loan.save();

    // 3. Deduct from chosen account
    account.balance -= totalPayable;
    await account.save();

    // 4. Create Debit Transaction
    const tx = await Transaction.create({
      user: userId,
      amount: totalPayable,
      type: "DEBIT",
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
      message: error.message || "Error pre-closing loan",
    });
  }
};
