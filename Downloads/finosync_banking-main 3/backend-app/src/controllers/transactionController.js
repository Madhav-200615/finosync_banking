// backend-app/src/controllers/transactionController.js

const User = require("../models/User");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const { redisClient } = require("../config/redis");
const { broadcastTx } = require("../services/ws");

// Helper function to extract category from description
function extractCategory(description) {
  const desc = description.toLowerCase();

  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('meal') || desc.includes('dining')) return 'FOOD';
  if (desc.includes('rent') || desc.includes('housing')) return 'RENT';
  if (desc.includes('shopping') || desc.includes('clothes') || desc.includes('fashion')) return 'SHOPPING';
  if (desc.includes('bill') || desc.includes('utility') || desc.includes('electricity') || desc.includes('water')) return 'BILLS';
  if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('game')) return 'ENTERTAINMENT';
  if (desc.includes('transport') || desc.includes('taxi') || desc.includes('uber') || desc.includes('fuel')) return 'TRANSPORT';
  if (desc.includes('health') || desc.includes('medical') || desc.includes('doctor')) return 'HEALTH';
  if (desc.includes('education') || desc.includes('course') || desc.includes('book')) return 'EDUCATION';
  if (desc.includes('wallet') || desc.includes('topup') || desc.includes('top-up')) return 'TRANSFER';

  return 'GENERAL';
}

// MONEY TRANSFER (USER → USER)
exports.transferMoney = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromAccountNumber, toAccountNumber, amount, pin, note } = req.body;

    if (!fromAccountNumber || !toAccountNumber || !amount || !pin)
      return res.status(400).json({ error: "Missing fields" });

    if (fromAccountNumber === toAccountNumber)
      return res.status(400).json({ error: "Cannot transfer to same account" });

    // Sender user
    const sender = await User.findById(userId);
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    // PIN CHECK
    const valid = await sender.verifyPin(pin);
    if (!valid) return res.status(401).json({ error: "Invalid PIN" });

    // Sender Account
    const senderAcc = await Account.findOne({
      userId,
      accountNumber: fromAccountNumber
    });

    if (!senderAcc)
      return res.status(404).json({ error: "Sender account not found" });

    // Receiver Account
    const receiverAcc = await Account.findOne({ accountNumber: toAccountNumber });
    if (!receiverAcc)
      return res.status(404).json({ error: "Receiver account not found" });

    // Balance checks
    if (senderAcc.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // For CURRENT accounts, enforce minimum 10000 balance after transfer
    if (String(senderAcc.type).toUpperCase() === "CURRENT") {
      const remainingAfter = senderAcc.balance - amount;
      if (remainingAfter < 10000) {
        return res.status(400).json({
          error: "Current account must maintain a minimum balance of ₹10,000 after transfer",
        });
      }
    }

    // BALANCE UPDATES
    senderAcc.balance -= amount;
    receiverAcc.balance += amount;

    await senderAcc.save();
    await receiverAcc.save();

    // TRANSACTION RECORDS
    // Extract category from description/note
    const category = extractCategory(note || "");

    const txSender = await Transaction.create({
      user: sender._id,  // Changed from userId to user
      type: "DEBIT",
      amount,
      description: note || "Transfer",
      category: category,
      balanceAfter: senderAcc.balance
    });

    const txReceiver = await Transaction.create({
      user: receiverAcc.userId,  // Changed from userId to user
      type: "CREDIT",
      amount,
      description: note || "Transfer received",
      category: category,
      balanceAfter: receiverAcc.balance
    });

    // CLEAR REDIS CACHE
    await redisClient.del(`tx:${sender._id}`);
    await redisClient.del(`tx:${receiverAcc.userId}`);

    // WS REALTIME UPDATE
    broadcastTx({
      type: "TRANSFER",
      sender: { userId: sender._id, tx: txSender, balance: senderAcc.balance },
      receiver: { userId: receiverAcc.userId, tx: txReceiver, balance: receiverAcc.balance }
    });

    // Generate reference ID
    const referenceId = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${txSender._id.toString().slice(-6).toUpperCase()}`;

    // Get receiver name
    const receiver = await User.findById(receiverAcc.userId);

    return res.json({
      success: true,
      message: "Transfer Successful",
      senderBalance: senderAcc.balance,
      referenceId,
      recipientName: receiver?.name || "Recipient",
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Transfer failed:");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ error: err.message || "Transfer failed" });
  }
};


// HISTORY ROUTE (unchanged)
exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const tx = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    return res.json({ success: true, tx });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to load transactions" });
  }
};


// SUMMARY ROUTE (restored + upgraded)
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTx = await Transaction.find({
      user: userId,
      createdAt: { $gte: today }
    }).sort({ createdAt: -1 });

    const credits = todayTx
      .filter(t => t.type === "CREDIT")
      .reduce((a, b) => a + b.amount, 0);

    const debits = todayTx
      .filter(t => t.type === "DEBIT")
      .reduce((a, b) => a + b.amount, 0);

    return res.json({
      success: true,
      summary: {
        totalCredits: credits,
        totalDebits: debits,
        transactionsCount: todayTx.length,
        todayTransactions: todayTx
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed summary" });
  }
};


// DASHBOARD ROUTE (restored + multi-account)
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await Account.find({ userId }).sort({ type: 1 });

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const recentTx = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const allTx = await Transaction.find({ user: userId });

    const totalCredits = allTx
      .filter(t => t.type === "CREDIT")
      .reduce((a, b) => a + b.amount, 0);

    const totalDebits = allTx
      .filter(t => t.type === "DEBIT")
      .reduce((a, b) => a + b.amount, 0);

    // Generate daily data for charts (last 7 days)
    const monthlyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTx = allTx.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= dayStart && txDate <= dayEnd;
      });

      const credit = dayTx.filter(t => t.type === "CREDIT").reduce((a, b) => a + b.amount, 0);
      const debit = dayTx.filter(t => t.type === "DEBIT").reduce((a, b) => a + b.amount, 0);

      monthlyData.push({
        label: date.toLocaleString('default', { weekday: 'short' }), // e.g., "Mon"
        credit,
        debit
      });
    }

    // Generate category breakdown (debits only)
    const categoryMap = {};
    allTx.filter(t => t.type === "DEBIT").forEach(t => {
      const cat = t.category || "general";
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

    const categoryData = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);

    // Calculate weekly totals (last 7 days) from the daily data
    const weeklyCredits = monthlyData.reduce((sum, day) => sum + day.credit, 0);
    const weeklyDebits = monthlyData.reduce((sum, day) => sum + day.debit, 0);
    const weeklyNet = weeklyCredits - weeklyDebits;

    // Calculate percentages for Traffic chart (based on weekly activity)
    const totalActivity = weeklyCredits + weeklyDebits;
    const creditPercentage = totalActivity > 0 ? Math.round((weeklyCredits / totalActivity) * 100) : 0;
    const debitPercentage = totalActivity > 0 ? Math.round((weeklyDebits / totalActivity) * 100) : 0;

    return res.json({
      success: true,
      dashboard: {
        accounts,
        totalBalance,
        recentTransactions: recentTx,
        totalCredits: weeklyCredits, // Sending weekly totals as requested
        totalDebits: weeklyDebits,   // Sending weekly totals as requested
        netCashflow: weeklyNet,
        creditPercentage,
        debitPercentage,
        monthly: monthlyData,
        byCategory: categoryData
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed dashboard" });
  }
};
