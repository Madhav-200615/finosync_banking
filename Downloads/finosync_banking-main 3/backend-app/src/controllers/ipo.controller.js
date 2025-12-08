const { createInvestment } = require("../services/investment.service");

exports.investIPO = async (req, res) => {
    try {
        const userId = req.user.sub; // from JWT middleware
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Valid amount is required" });
        }

        const investment = await createInvestment(userId, {
            type: "IPO",
            productName: "IPO Application",
            category: "Primary Market",
            riskLevel: "High",
            amount: Number(amount),
            cagr3Y: null
        });

        res.json({
            success: true,
            message: "IPO investment successful",
            investment
        });
    } catch (error) {
        console.error("IPO investment failed:", error);
        res.status(500).json({ error: error.message || "Failed to invest in IPO" });
    }
};

exports.getMyIPO = async (req, res) => {
    try {
        const { getInvestmentsByUser } = require("../services/investment.service");
        const investments = await getInvestmentsByUser(req.user.sub);
        const ipos = investments.filter(inv => inv.type === "IPO");
        res.json(ipos);
    } catch (error) {
        console.error("Get IPO failed:", error);
        res.status(500).json({ error: "Failed to fetch IPO investments" });
    }
};

