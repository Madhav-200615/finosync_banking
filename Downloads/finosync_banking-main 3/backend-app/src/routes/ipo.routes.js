const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/ipo.controller");

router.use(auth);

router.post("/", controller.investIPO);
router.get("/", controller.getMyIPO);

module.exports = router;
