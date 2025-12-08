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

// Generate 6 digit otp
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
        type: 'CREDIT',
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
    const { accountNumber, pin, phone } = req.body;

    // Check if accountNumber or phone is provided
    if ((!accountNumber && !phone) || !pin) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let user;

    // Determine if the provided accountNumber is actually a phone number
    // Phone numbers are 10 digits, account numbers are 6 digits
    if (accountNumber && /^\d{10}$/.test(accountNumber)) {
      // It's a phone number
      user = await User.findOne({ phone: accountNumber });
    } else if (phone) {
      // Phone field was explicitly provided
      user = await User.findOne({ phone });
    } else if (accountNumber) {
      // It's an account number
      user = await User.findOne({ accountNumber });
    }

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
    const { accountNumber, phone, email } = req.body;

    // Find user by account number or phone
    let user;
    if (accountNumber) {
      user = await User.findOne({ accountNumber });
    } else if (phone) {
      user = await User.findOne({ phone });
    } else {
      return res.status(400).json({ error: "Account number or phone is required" });
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const otp = generateOtp();

    // Save OTP in Redis with 60 sec expiry (key includes account for security)
    const redisKey = `forgot-pin:${user.accountNumber}:${email}`;
    await redisClient.set(redisKey, otp, { EX: 60 });

    // Send OTP via email
    const emailOtpService = require('../services/emailOtpService');
    try {
      await emailOtpService.sendEmailOTP(email, otp, user.name);
      console.log(`Forgot PIN OTP sent to ${email}:`, otp);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Continue even if email fails - OTP is logged for development
    }

    return res.json({
      success: true,
      message: "OTP sent to your email",
      maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "OTP send failed" });
  }
};


// VERIFY OTP → GET RESET TOKEN
exports.verifyOtp = async (req, res) => {
  try {
    const { accountNumber, phone, email, otp } = req.body;

    // Find user
    let user;
    if (accountNumber) {
      user = await User.findOne({ accountNumber });
    } else if (phone) {
      user = await User.findOne({ phone });
    } else {
      return res.status(400).json({ error: "Account number or phone is required" });
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!email) return res.status(400).json({ error: "Email is required" });

    // Check OTP in Redis
    const redisKey = `forgot-pin:${user.accountNumber}:${email}`;
    const savedOtp = await redisClient.get(redisKey);

    if (!savedOtp) return res.status(400).json({ error: "OTP expired or not found" });

    if (otp !== savedOtp)
      return res.status(401).json({ error: "Invalid OTP" });

    // Generate a temporary reset token (valid for 10 mins)
    const resetToken = jwt.sign(
      { sub: user._id, purpose: "reset_pin", email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // Delete OTP from Redis
    await redisClient.del(redisKey);

    return res.json({ success: true, message: "OTP verified", resetToken });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "OTP verify failed" });
  }
};

// RESET PIN (Requires Reset Token)
exports.resetPin = async (req, res) => {
  try {
    const { resetToken, newPin } = req.body;

    if (!resetToken || !newPin) {
      return res.status(400).json({ error: "Missing token or PIN" });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: "PIN must be 4 digits" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Reset token has expired. Please request a new OTP." });
      }
      return res.status(401).json({ error: "Invalid reset token" });
    }

    if (decoded.purpose !== "reset_pin") {
      return res.status(401).json({ error: "Invalid token purpose" });
    }

    const user = await User.findById(decoded.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update PIN using findByIdAndUpdate to avoid full validation
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPin, salt);

    await User.findByIdAndUpdate(decoded.sub, { pinHash });

    return res.json({ success: true, message: "PIN reset successfully" });

  } catch (err) {
    console.error("Reset PIN error:", err);
    return res.status(500).json({ error: "Failed to reset PIN. Please try again." });
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-pinHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountNumber: user.accountNumber
      }
    });
  } catch (err) {
    console.error("GetMe Error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};
