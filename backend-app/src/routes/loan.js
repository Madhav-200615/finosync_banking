// backend-app/src/routes/loan.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  applyLoan,
  getAllLoans,
  getLoanDetails,
  payEmi,
  preCloseLoan,
  getDueBills,
} = require("../controllers/loanController");

// Apply for a new loan
router.post("/", auth, applyLoan);

// Get all loans for logged-in user
router.get("/", auth, getAllLoans);

// Get due loan bills
router.get("/due-bills", auth, getDueBills);

// Get single loan details
router.get("/:loanId", auth, getLoanDetails);

// Pay EMI
router.post("/:loanId/pay-emi", auth, payEmi);

// Pre-close loan
router.post("/:loanId/preclose", auth, preCloseLoan);

module.exports = router;
