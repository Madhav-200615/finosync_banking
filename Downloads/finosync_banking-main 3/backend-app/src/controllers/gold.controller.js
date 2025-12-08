const { createInvestment } = require("../services/investment.service");

exports.buyGoldBond = async (req, res) => {
    try {
        const userId = req.user.sub; // from JWT middleware
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Valid amount is required" });
        }

        const investment = await createInvestment(userId, {
            type: "SOVEREIGN_GOLD_BOND",
            productName: "Sovereign Gold Bond",
            category: "Gold",
            riskLevel: "Low",
            amount: Number(amount),
            cagr3Y: null
        });

        res.json({
            success: true,
            message: "Sovereign Gold Bond purchased successfully",
            investment
        });
    } catch (error) {
        console.error("Gold bond purchase failed:", error);
        res.status(500).json({ error: error.message || "Failed to purchase gold bond" });
    }
};

exports.getMyGold = async (req, res) => {
    try {
        const { getInvestmentsByUser } = require("../services/investment.service");
        const investments = await getInvestmentsByUser(req.user.sub);
        const goldBonds = investments.filter(inv => inv.type === "SOVEREIGN_GOLD_BOND");
        res.json(goldBonds);
    } catch (error) {
        console.error("Get gold bonds failed:", error);
        res.status(500).json({ error: "Failed to fetch gold bonds" });
    }
};

