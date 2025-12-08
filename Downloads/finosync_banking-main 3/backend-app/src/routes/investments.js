const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/investmentController");

router.use(auth);

router.get("/", controller.getMyInvestments);
router.post("/", controller.createInvestment);
router.get("/mutual-funds", controller.getMutualFundRecommendations);

module.exports = router;
