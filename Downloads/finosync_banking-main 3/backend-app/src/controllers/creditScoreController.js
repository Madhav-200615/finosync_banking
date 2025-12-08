const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

exports.getCreditScore = async (req, res) => {
  try {
    const userId = req.user.id;

    // last 6 months data
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 6);

    const txns = await Transaction.find({
      user: userId,
      createdAt: { $gte: monthsAgo }
    });

    let score = 600; // base

    const totalCredit = txns
      .filter(t => t.type === "CREDIT")
      .reduce((a, b) => a + b.amount, 0);

    const totalDebit = txns
      .filter(t => t.type === "DEBIT")
      .reduce((a, b) => a + b.amount, 0);

    const creditToDebitRatio = totalCredit - totalDebit;

    if (creditToDebitRatio > 0) score += 50;
    if (totalCredit > 50000) score += 40;
    if (totalDebit < 30000) score += 30;
    if (txns.length > 20) score += 20;

    if (score > 850) score = 850;
    if (score < 300) score = 300;

    res.json({
      score,
      rating:
        score >= 750 ? "Excellent" :
        score >= 680 ? "Good" :
        score >= 580 ? "Fair" :
        "Poor"
    });

  } catch (err) {
    console.error("Credit Score Error:", err);
    res.status(500).json({ error: "Failed to calculate credit score" });
  }
};
