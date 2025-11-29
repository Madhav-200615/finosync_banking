const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");
const Transaction = require("../models/Transaction");

// Generate 6 digit account no
function generateAccNo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate 4-digit otp
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const Account = require("../models/Account");

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const {
      name,
      phone,
      pin,
      aadhar,
      pan,
      address,
      age,
      accountType = 'SAVINGS',
      initialDeposit = 0,
      accountNumber: providedAccountNumber
    } = req.body;

    // Basic validation
    if (!name || !phone || !pin || !aadhar || !pan || !address || !age) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 4 digits" });
    }

    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone number must be 10 digits" });
    }

    // Validate Aadhar format
    if (!/^\d{12}$/.test(aadhar)) {
      return res.status(400).json({ error: "Aadhar must be 12 digits" });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ phone }, { aadhar }, { pan }]
    });

    if (existingUser) {
      let errorField = '';
      if (existingUser.phone === phone) errorField = 'Phone number';
      else if (existingUser.aadhar === aadhar) errorField = 'Aadhar number';
      else if (existingUser.pan === pan) errorField = 'PAN number';

      return res.status(400).json({
        error: `${errorField} is already registered`
      });
    }

    // Use provided account number or generate one
    let accountNumber = providedAccountNumber;

    // Validate account number if provided
    if (accountNumber) {
      if (!/^\d{6}$/.test(accountNumber)) {
        return res.status(400).json({ error: "Account number must be 6 digits" });
      }
      // Check if account number already exists
      const existingAccount = await User.findOne({ accountNumber });
      if (existingAccount) {
        return res.status(400).json({ error: "Account number already exists" });
      }
    } else {
      // Generate if not provided (backward compatibility)
      accountNumber = generateAccNo();
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // Create user
    const user = new User({
      name,
      phone,
      aadhar,
      pan,
      address,
      age: Number(age),
      pinHash,
      accountNumber
    });

    await user.save();

    // Create main account
    const account = new Account({
      userId: user._id,
      accountNumber,
      type: accountType,
      balance: Number(initialDeposit) || 0
    });

    await account.save();

    // Create wallet account
    const walletAccount = new Account({
      userId: user._id,
      accountNumber: `${accountNumber}W`,
      type: 'WALLET',
      balance: 0
    });

    await walletAccount.save();

    // If there's an initial deposit, create a transaction record
    if (Number(initialDeposit) > 0) {
      const depositTransaction = new Transaction({
        user: user._id,
        type: 'credit',
        category: 'deposit',
        amount: Number(initialDeposit),
        description: 'Initial deposit'
      });
      await depositTransaction.save();
    }

    // Generate JWT token (using same structure as login for consistency)
    const token = jwt.sign(
      { sub: user._id, acc: user.accountNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        name: user.name,
        accountNumber: user.accountNumber,
        phone: user.phone,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: "Registration failed. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// LOGIN
exports.login = async (req, res) => {
  try {
    const { accountNumber, pin } = req.body;

    if (!accountNumber || !pin)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ accountNumber });

    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await user.verifyPin(pin);

    if (!valid) return res.status(401).json({ error: "Invalid PIN" });

    const token = jwt.sign(
      { sub: user._id, acc: user.accountNumber },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        name: user.name,
        accountNumber: user.accountNumber,
        phone: user.phone,
      },
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Login failed" });
  }
};


// FORGOT PIN REQUEST → OTP
exports.forgotPin = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "Phone not found" });

    const otp = generateOtp();

    // save otp in redis with 30 sec expiry
    await redisClient.set(`otp:${phone}`, otp, { EX: 30 });

    console.log("OTP sent:", otp);

    return res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "OTP send failed" });
  }
};


// VERIFY OTP → RESET PIN
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, newPin } = req.body;

    const savedOtp = await redisClient.get(`otp:${phone}`);

    if (!savedOtp) return res.status(400).json({ error: "OTP expired" });

    if (otp !== savedOtp)
      return res.status(401).json({ error: "Invalid OTP" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.pinHash = await bcrypt.hash(newPin, 10);
    await user.save();

    // delete OTP
    await redisClient.del(`otp:${phone}`);

    return res.json({ success: true, message: "PIN reset successfully" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "OTP verify failed" });
  }
};
