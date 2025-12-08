const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const auth = require('../middleware/auth');

// All OTP routes require authentication
router.post('/generate', auth, otpController.generateOTP);
router.post('/verify', auth, otpController.verifyOTP);
router.post('/resend', auth, otpController.resendOTP);

module.exports = router;
