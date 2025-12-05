// backend-app/src/controllers/accountController.js

const User = require("../models/User");
const Account = require("../models/Account");

// Create Savings + Wallet on new user registration
exports.createUserAccounts = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const base = user.accountNumber;

  const accountsToCreate = [
    { type: "SAVINGS", accountNumber: base },
    { type: "WALLET", accountNumber: base + "02" }
    // CURRENT account no longer auto-created
  ];

  const created = [];

  for (let acc of accountsToCreate) {
    const exists = await Account.findOne({
      userId,
      type: acc.type
    });

    if (!exists) {
      const newAcc = await Account.create({
        userId,
        type: acc.type,
        accountNumber: acc.accountNumber,
        balance: 0
      });

      created.push(newAcc);
    }
  }

  return created;
};


// Create CURRENT Account (Business)
exports.createCurrentAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { businessName, gstNo, depositAmount } = req.body;

    if (!businessName || !gstNo || !depositAmount)
      return res.status(400).json({ error: "All fields required" });

    if (depositAmount < 10000)
      return res.status(400).json({ error: "Minimum ₹10,000 required" });

    // check existing
    const exists = await Account.findOne({
      userId,
      type: "CURRENT"
    });

    if (exists)
      return res.status(400).json({ error: "Current Account already exists" });

    // Create Current Account
    const user = await User.findById(userId);

    const currentAcc = await Account.create({
      userId,
      type: "CURRENT",
      accountNumber: user.accountNumber + "01",
      businessName,
      gstNo,
      balance: Number(depositAmount)
    });

    return res.json({
      success: true,
      message: "Current Account created successfully",
      account: currentAcc
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to create Current Account" });
  }
};


// GET all accounts
exports.getMyAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await Account.find({ userId }).sort({ type: 1 });

    return res.json({
      success: true,
      accounts
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to load accounts" });
  }
};


// Verify account existence for transfer
// GET /api/accounts/verify/:accountNumber
exports.verifyAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    if (!accountNumber) {
      return res.status(400).json({ error: "Account number required" });
    }

    // Find account by account number
    const account = await Account.findOne({ accountNumber });

    if (!account) {
      return res.json({
        valid: false,
        error: "Account not found"
      });
    }

    // Get account holder name
    const user = await User.findById(account.userId);

    return res.json({
      valid: true,
      accountHolder: user?.name || "Account Holder",
      accountType: account.type
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to verify account" });
  }
};

