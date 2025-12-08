const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/gold.controller");

router.use(auth);

router.post("/", controller.buyGoldBond);
router.get("/", controller.getMyGold);

module.exports = router;
