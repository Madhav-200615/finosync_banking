// backend-app/src/routes/accounts.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Account = require("../models/Account");
const User = require("../models/User");

// GET /api/accounts/verify/:accountNumber - Verify account existence
router.get("/verify/:accountNumber", auth, async (req, res) => {
  try {
    const { accountNumber } = req.params;

    if (!accountNumber) {
      return res.status(400).json({ error: "Account number required" });
    }

    const account = await Account.findOne({ accountNumber });

    if (!account) {
      return res.json({ valid: false, error: "Account not found" });
    }

    const user = await User.findById(account.userId);

    return res.json({
      valid: true,
      accountHolder: user?.name || "Account Holder",
      accountType: account.type
    });
  } catch (err) {
    console.error("Verify account error:", err);
    return res.status(500).json({ error: "Failed to verify account" });
  }
});

// GET /api/accounts - Fetch all accounts of logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await Account.find({ userId });

    // Sort: SAVINGS first, CURRENT second, WALLET last
    const priority = { SAVINGS: 1, CURRENT: 2, WALLET: 3 };

    const sortedAccounts = accounts
      .sort((a, b) => priority[a.type] - priority[b.type])
      .map((acc) => ({
        type: acc.type,
        accountNumber: acc.accountNumber,
        balance: acc.balance,
        businessName: acc.businessName || null,
        gstNo: acc.gstNo || null
      }));

    return res.json({
      success: true,
      accounts: sortedAccounts
    });
  } catch (err) {
    console.error("GET /accounts error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts"
    });
  }
});

// POST /api/accounts/create-current - Create CURRENT account
router.post("/create-current", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, gstNo } = req.body;

    if (!businessName || !gstNo) {
      return res.status(400).json({
        success: false,
        message: "Business Name & GST Number required for Current Account"
      });
    }

    // Minimum deposit for Current Account
    const MIN_AMOUNT = 10000;

    // Generate unique account number (simple approach)
    const accountNumber =
      Math.floor(10000000 + Math.random() * 90000000).toString();

    const account = await Account.create({
      userId,
      type: "CURRENT",
      accountNumber,
      balance: MIN_AMOUNT,
      businessName,
      gstNo
    });

    return res.status(201).json({
      success: true,
      message: "Current account created successfully",
      account
    });
  } catch (err) {
    console.error("POST /create-current error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create current account"
    });
  }
});

module.exports = router;
