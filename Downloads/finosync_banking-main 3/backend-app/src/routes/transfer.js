const router = require("express").Router();
const auth = require("../middleware/auth");
const { transferMoney } = require("../controllers/transactionController");

router.post("/", auth, transferMoney);

module.exports = router;
