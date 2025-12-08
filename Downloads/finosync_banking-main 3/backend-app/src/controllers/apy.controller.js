const { createInvestment } = require("../services/investment.service");

exports.startAPY = async (req, res) => {
    try {
        const userId = req.user.sub; // from JWT middleware
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Valid amount is required" });
        }

        const investment = await createInvestment(userId, {
            type: "APY",
            productName: "Atal Pension Yojana",
            category: "Pension",
            riskLevel: "Low",
            amount: Number(amount),
            cagr3Y: null
        });

        res.json({
            success: true,
            message: "APY enrollment successful",
            investment
        });
    } catch (error) {
        console.error("APY enrollment failed:", error);
        res.status(500).json({ error: error.message || "Failed to enroll in APY" });
    }
};

exports.getMyAPY = async (req, res) => {
    try {
        const { getInvestmentsByUser } = require("../services/investment.service");
        const investments = await getInvestmentsByUser(req.user.sub);
        const apy = investments.filter(inv => inv.type === "APY");
        res.json(apy);
    } catch (error) {
        console.error("Get APY failed:", error);
        res.status(500).json({ error: "Failed to fetch APY investments" });
    }
};
