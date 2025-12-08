const { createInvestment } = require("../services/investment.service");

exports.investNPS = async (req, res) => {
    try {
        const userId = req.user.sub; // from JWT middleware
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Valid amount is required" });
        }

        const investment = await createInvestment(userId, {
            type: "NPS",
            productName: "National Pension System",
            category: "Retirement",
            riskLevel: "Medium",
            amount: Number(amount),
            cagr3Y: null
        });

        res.json({
            success: true,
            message: "NPS investment successful",
            investment
        });
    } catch (error) {
        console.error("NPS investment failed:", error);
        res.status(500).json({ error: error.message || "Failed to invest in NPS" });
    }
};

exports.getMyNPS = async (req, res) => {
    try {
        const { getInvestmentsByUser } = require("../services/investment.service");
        const investments = await getInvestmentsByUser(req.user.sub);
        const nps = investments.filter(inv => inv.type === "NPS");
        res.json(nps);
    } catch (error) {
        console.error("Get NPS failed:", error);
        res.status(500).json({ error: "Failed to fetch NPS investments" });
    }
};

