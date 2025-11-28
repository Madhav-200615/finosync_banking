const Transaction = require("../models/Transaction");

exports.getStatements = async (req, res) => {
  try {
    const userId = req.user.id;

    const tx = await Transaction.find({ user: userId }).sort({
      createdAt: 1,
    });

    const monthly = {};

    let runningBalance = 0;

    tx.forEach((t) => {
      const date = new Date(t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          monthName: date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
          income: 0,
          expenses: 0,
          closingBalance: 0,
        };
      }

      if (t.type === "credit") {
        monthly[monthKey].income += t.amount;
        runningBalance += t.amount;
      } else {
        monthly[monthKey].expenses += t.amount;
        runningBalance -= t.amount;
      }

      monthly[monthKey].closingBalance = runningBalance;
    });

    res.json(Object.values(monthly));
  } catch (err) {
    console.error("STATEMENTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
