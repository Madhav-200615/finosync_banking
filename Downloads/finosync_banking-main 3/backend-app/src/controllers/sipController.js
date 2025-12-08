const sipService = require("../services/sip.service");

exports.getMySips = async (req, res) => {
    try {
        const data = await sipService.getUserSips(req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        console.error("getMySips ERROR:", err);
        res.status(500).json({ success: false, error: "Failed to load SIPs" });
    }
};

exports.createSip = async (req, res) => {
    try {
        const userId = req.user.id;
        const sip = await sipService.createSip(userId, req.body);

        res.json({ success: true, data: sip });
    } catch (err) {
        console.error("createSip ERROR:", err);
        res.status(500).json({ success: false, error: "Failed to create SIP" });
    }
};

exports.cancelSip = async (req, res) => {
    try {
        const sip = await sipService.cancelSip(req.params.id, req.user.id);
        res.json({ success: true, data: sip });
    } catch (err) {
        console.error("cancelSip ERROR:", err);
        res.status(500).json({ success: false, error: "Failed to cancel SIP" });
    }
};
