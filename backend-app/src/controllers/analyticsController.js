const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

exports.getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Monthly Trend (Existing)
    const monthlyData = await Transaction.aggregate([

      {
        $match: {
          user: userId
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          credit: {
            $sum: {
              $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0]
            }
          },
          debit: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }, // Sort ascending for chart
      {
        $project: {
          label: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: "$_id.month" }
            ]
          },
          credit: 1,
          debit: 1,
          _id: 0
        }
      }
    ]);

    // 2. Category-wise Spending (New)
    const byCategory = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: "debit" // Only expenses
        }
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" }
        }
      },
      {
        $project: {
          category: "$_id",
          amount: 1,
          _id: 0
        }
      }
    ]);

    // 3. Current Month Summary (New)
    const currentMonthStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0]
            }
          }
        }
      }
    ]);

    const summary = currentMonthStats[0] || { income: 0, expenses: 0 };

    res.json({
      monthly: monthlyData,
      byCategory,
      summary: {
        income: summary.income || 0,
        expenses: summary.expenses || 0
      }
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
