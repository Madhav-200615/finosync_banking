const FD = require("../models/FD");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const { broadcastTx } = require("../services/ws");

// helper: add months
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}


// POST /api/fd/create
exports.createFD = async (req, res) => {
  try {
    const { accountType, amount } = req.body;
    const typeUpper = accountType.toUpperCase();

    if (!typeUpper || !["SAVINGS", "WALLET"].includes(typeUpper)) {
      return res.status(400).json({ error: "Invalid account type" });
    }

    if (!amount || amount < 1000) {
      return res.status(400).json({ error: "Minimum FD amount is ₹1000" });
    }

    const account = await Account.findOne({
      user: req.user.id,
      type: typeUpper,
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // deduct from account
    account.balance -= amount;
    await account.save();

    const start = new Date();
    const tenureMonths = 12;
    const interestRate = 0.07; // 7% p.a.
    const maturityDate = addMonths(start, tenureMonths);

    const fd = await FD.create({
      user: req.user.id,
      account: account._id,
      amount,
      tenureMonths,
      interestRate,
      startDate: start,
      maturityDate,
    });

    // debit transaction for FD creation
    const tx = await Transaction.create({
      user: req.user.id,
      amount,
      type: "debit",
      category: "fd",
      description: `FD created (${accountType}) @7% for 12 months`,
    });

    broadcastTx(tx);

    res.json({
      message: "FD created successfully",
      fd,
      accountBalance: account.balance,
    });
  } catch (err) {
    console.error("FD CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/fd/list
exports.getFDs = async (req, res) => {
  try {
    const fds = await FD.find({ user: req.user.id })
      .populate("account")
      .sort({ createdAt: -1 });

    res.json(fds);
  } catch (err) {
    console.error("FD LIST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/fd/close/:id
exports.closeFD = async (req, res) => {
  try {
    const { id } = req.params;

    const fd = await FD.findOne({
      _id: id,
      user: req.user.id,
      status: "active",
    }).populate("account");

    if (!fd) {
      return res.status(404).json({ error: "FD not found or already closed" });
    }

    const now = new Date();
    const isPremature = now < fd.maturityDate;

    const principal = fd.amount;

    // months active
    const monthsActive =
      (now.getFullYear() - fd.startDate.getFullYear()) * 12 +
      (now.getMonth() - fd.startDate.getMonth()) || 1;

    let rate;
    if (isPremature) {
      rate = 0.04; // 4% penalty rate
    } else {
      rate = fd.interestRate; // 7%
    }

    const interest = Math.round(principal * rate * (monthsActive / 12));
    const payout = principal + interest;

    // credit back to account
    const account = await Account.findOne({
      _id: fd.account._id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(500).json({ error: "Linked account missing" });
    }

    account.balance += payout;
    await account.save();

    fd.status = "closed";
    fd.closedAt = now;
    fd.interestEarned = interest;
    fd.closingAmount = payout;
    await fd.save();

    const tx = await Transaction.create({
      user: req.user.id,
      amount: payout,
      type: "credit",
      category: "fd",
      description: isPremature
        ? `Premature FD closure (${monthsActive} months)`
        : `FD matured (${monthsActive} months)`,
    });

    broadcastTx(tx);

    res.json({
      message: isPremature
        ? "FD closed prematurely with penalty rate"
        : "FD matured and closed",
      fd,
      accountBalance: account.balance,
    });
  } catch (err) {
    console.error("FD CLOSE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
