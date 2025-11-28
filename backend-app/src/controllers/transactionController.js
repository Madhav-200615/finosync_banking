// backend-app/src/controllers/transactionController.js

const User = require("../models/User");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const { redisClient } = require("../config/redis");
const { broadcastTx } = require("../services/ws");

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

    if (senderAcc.balance < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    // BALANCE UPDATES
    senderAcc.balance -= amount;
    receiverAcc.balance += amount;

    await senderAcc.save();
    await receiverAcc.save();

    // TRANSACTION RECORDS
    const txSender = await Transaction.create({
      userId: sender._id,
      type: "debit",
      amount,
      note,
      fromAccount: fromAccountNumber,
      toAccount: toAccountNumber,
      balanceAfter: senderAcc.balance
    });

    const txReceiver = await Transaction.create({
      userId: receiverAcc.userId,
      type: "credit",
      amount,
      note,
      fromAccount: fromAccountNumber,
      toAccount: toAccountNumber,
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

    return res.json({
      success: true,
      message: "Transfer Successful",
      senderBalance: senderAcc.balance
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Transfer failed" });
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
      .filter(t => t.type === "credit")
      .reduce((a, b) => a + b.amount, 0);

    const debits = todayTx
      .filter(t => t.type === "debit")
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
      .filter(t => t.type === "credit")
      .reduce((a, b) => a + b.amount, 0);

    const totalDebits = allTx
      .filter(t => t.type === "debit")
      .reduce((a, b) => a + b.amount, 0);

    // Generate monthly data for charts (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTx = allTx.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const credit = monthTx.filter(t => t.type === "credit").reduce((a, b) => a + b.amount, 0);
      const debit = monthTx.filter(t => t.type === "debit").reduce((a, b) => a + b.amount, 0);

      monthlyData.push({
        label: date.toLocaleString('default', { month: 'short' }),
        credit,
        debit
      });
    }

    // Generate category breakdown (debits only)
    const categoryMap = {};
    allTx.filter(t => t.type === "debit").forEach(t => {
      const cat = t.category || "general";
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

    const categoryData = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);

    return res.json({
      success: true,
      dashboard: {
        accounts,
        totalBalance,
        recentTransactions: recentTx,
        totalCredits,
        totalDebits,
        monthly: monthlyData,
        byCategory: categoryData
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed dashboard" });
  }
};
