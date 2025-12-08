const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Summary
    const summaryAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
        },
      },
    ]);

    let totalCredit = 0,
      totalDebit = 0,
      creditCount = 0,
      debitCount = 0,
      avgTxnAmount = 0,
      largestTxn = 0;

    summaryAgg.forEach((s) => {
      if (s._id === "CREDIT") {
        totalCredit = s.totalAmount;
        creditCount = s.count;
      }
      if (s._id === "DEBIT" || s._id === "EMI") {
        totalDebit += s.totalAmount;
        debitCount += s.count;
      }
      avgTxnAmount += s.avgAmount || 0;
      largestTxn = Math.max(largestTxn, s.maxAmount || 0);
    });

    const netFlow = totalCredit - totalDebit;

    // Trend chart
    const trendAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$createdAt" } },
          credit: {
            $sum: {
              $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
            },
          },
          debit: {
            $sum: {
              $cond: [{ $in: ["$type", ["DEBIT", "EMI"]] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    const trend = trendAgg.map((t) => ({
      day: t._id.day,
      credit: t.credit,
      debit: t.debit,
    }));

    // Category pie chart
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$category",
          credit: {
            $sum: {
              $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
            },
          },
          debit: {
            $sum: {
              $cond: [{ $in: ["$type", ["DEBIT", "EMI"]] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const byCategory = categoryAgg.map((c) => ({
      category: c._id,
      credit: c.credit,
      debit: c.debit,
    }));

    // Recent transactions
    const recent = await Transaction.find({
      user: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      summary: {
        month: now.toLocaleString("default", { month: "long", year: "numeric" }),
        totalCredit,
        totalDebit,
        netFlow,
        creditCount,
        debitCount,
        avgTxnAmount,
        largestTxn,
      },
      trend,
      byCategory,
      recent: recent.map((t) => ({
        id: t._id,
        date: t.createdAt,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
      })),
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
};
