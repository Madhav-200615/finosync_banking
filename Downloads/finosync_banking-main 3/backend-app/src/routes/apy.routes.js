const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/apy.controller");

router.use(auth);

router.post("/", controller.startAPY);
router.get("/", controller.getMyAPY);

module.exports = router;
