const router = require("express").Router();
const auth = require("../middleware/auth");
const { getSummary } = require("../controllers/analyticsController");

router.get("/monthly", auth, getSummary);

module.exports = router;
