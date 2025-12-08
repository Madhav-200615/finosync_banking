// backend-app/src/routes/transactions.js

const router = require("express").Router();
const auth = require("../middleware/auth");

const {
  transferMoney,
  getMyTransactions,
  getSummary,
  getDashboardData
} = require("../controllers/transactionController");

// HISTORY
router.get("/", auth, getMyTransactions);

// OLD COMPATIBLE HISTORY ROUTE
router.get("/history", auth, getMyTransactions);

// SUMMARY
router.get("/summary", auth, getSummary);

// DASHBOARD
router.get("/dashboard", auth, getDashboardData);

// TRANSFER
router.post("/transfer", auth, transferMoney);

module.exports = router;
