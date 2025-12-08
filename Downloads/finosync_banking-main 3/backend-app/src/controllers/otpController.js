const otpService = require('../services/otpService');
const emailOtpService = require('../services/emailOtpService');
const User = require('../models/User');

/**
 * Generate and send OTP to user
 * POST /api/otp/generate
 */
exports.generateOTP = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body; // Get email from request body

        // Check rate limiting
        const canRequest = await otpService.canRequestOTP(userId);
        if (!canRequest) {
            return res.status(429).json({
                error: 'Too many OTP requests. Please wait 5 minutes before requesting again.'
            });
        }

        // Use provided email or fallback to user's profile email
        let emailToUse = email;

        if (!emailToUse) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            emailToUse = user.email;
        }

        // Validate email format
        if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        const phoneNumber = '+919999999999'; // For internal tracking

        // Generate OTP
        const otpCode = await otpService.generateOTP(userId, phoneNumber);

        // Get user name for email personalization
        const user = await User.findById(userId);

        // Send OTP via Email (FREE!)
        await emailOtpService.sendEmailOTP(emailToUse, otpCode, user?.name || 'User');

        res.json({
            success: true,
            message: 'OTP sent successfully',
            email: emailToUse.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
            expirySeconds: 300
        });

    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({ error: 'Failed to generate OTP' });
    }
};

/**
 * Verify OTP submitted by user
 * POST /api/otp/verify
 */
exports.verifyOTP = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp } = req.body;

        if (!otp || otp.length !== 6) {
            return res.status(400).json({ error: 'Invalid OTP format' });
        }

        // Verify OTP
        const result = await otpService.verifyOTP(userId, otp);

        if (!result.valid) {
            return res.status(400).json({
                error: result.error || 'Invalid OTP'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};

/**
 * Resend OTP to user
 * POST /api/otp/resend
 */
exports.resendOTP = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check rate limiting
        const canRequest = await otpService.canRequestOTP(userId);
        if (!canRequest) {
            return res.status(429).json({
                error: 'Too many OTP requests. Please wait before requesting again.'
            });
        }

        // Get user's email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const email = user.email;
        const phoneNumber = user.phone || user.mobile || '+919999999999';

        // Generate new OTP
        const otpCode = await otpService.generateOTP(userId, phoneNumber);

        // Send OTP via Email
        await emailOtpService.sendEmailOTP(email, otpCode, user.name);

        res.json({
            success: true,
            message: 'OTP resent successfully',
            email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            expirySeconds: 300
        });

    } catch (error) {
        console.error('OTP resend error:', error);
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
};
