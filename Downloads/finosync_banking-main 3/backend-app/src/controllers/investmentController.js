// backend-app/src/controllers/investmentController.js

const investmentService = require("../services/investment.service");

// GET /api/investments
exports.getMyInvestments = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await investmentService.getInvestmentsByUser(userId);

        return res.json({ success: true, data });
    } catch (err) {
        console.error("getMyInvestments ERROR:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch investments",
        });
    }
};

// GET /api/investments/mutual-funds
exports.getMutualFundRecommendations = async (req, res) => {
    try {
        const data = await investmentService.getMutualFundRecommendations();
        return res.json({ success: true, data });
    } catch (err) {
        console.error("MF Recommendation ERROR:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to load recommendations",
        });
    }
};

// POST /api/investments
exports.createInvestment = async (req, res) => {
    try {
        const userId = req.user.id;
        const investment = await investmentService.createInvestment(userId, req.body);

        return res.status(201).json({ success: true, data: investment });
    } catch (err) {
        console.error("createInvestment ERROR:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to create investment",
        });
    }
};
