const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/nps.controller");

router.use(auth);

router.post("/", controller.investNPS);
router.get("/", controller.getMyNPS);

module.exports = router;
