const { redisClient } = require('../config/redis');

/**
 * OTP Service for secure transaction verification
 * Uses Redis for temporary OTP storage with TTL
 */

const OTP_EXPIRY = 300; // 5 minutes in seconds
const OTP_LENGTH = 6;

/**
 * Generate a random 6-digit OTP
 */
function generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store OTP for a user
 * @param {string} userId - User ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<string>} Generated OTP code
 */
async function generateOTP(userId, phoneNumber) {
    try {
        const otpCode = generateOTPCode();
        const key = `otp:${userId}`;

        // Store OTP in Redis with expiry
        await redisClient.setEx(key, OTP_EXPIRY, otpCode);

        // Store generation timestamp
        await redisClient.setEx(`${key}:timestamp`, OTP_EXPIRY, Date.now().toString());

        console.log(`✅ OTP generated for user ${userId}: ${otpCode} (Demo Mode)`);

        return otpCode;
    } catch (error) {
        console.error('Error generating OTP:', error);
        throw new Error('Failed to generate OTP');
    }
}

/**
 * Verify OTP for a user
 * @param {string} userId - User ID
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} True if OTP is valid
 */
async function verifyOTP(userId, otp) {
    try {
        const key = `otp:${userId}`;
        const storedOTP = await redisClient.get(key);

        if (!storedOTP) {
            return { valid: false, error: 'OTP expired or not found' };
        }

        if (storedOTP !== otp) {
            return { valid: false, error: 'Invalid OTP' };
        }

        // OTP is valid, delete it to prevent reuse
        await redisClient.del(key);
        await redisClient.del(`${key}:timestamp`);

        console.log(`✅ OTP verified successfully for user ${userId}`);

        return { valid: true };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new Error('Failed to verify OTP');
    }
}

/**
 * Send OTP via SMS
 * Uses Twilio for real SMS delivery in production
 * Falls back to demo mode if credentials not configured
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP code to send
 */
async function sendOTP(phoneNumber, otp) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        // Check if Twilio credentials are configured
        if (accountSid && authToken && fromNumber) {
            // PRODUCTION MODE: Send real SMS via Twilio
            const twilio = require('twilio');
            const twilioClient = twilio(accountSid, authToken);

            const message = await twilioClient.messages.create({
                body: `Your FinoSync OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
                from: fromNumber,
                to: phoneNumber
            });

            console.log(`✅ SMS sent successfully to ${phoneNumber}`);
            console.log(`📱 Twilio Message SID: ${message.sid}`);

            return true;
        } else {
            // DEMO MODE: Just log the OTP
            console.log('\n' + '='.repeat(60));
            console.log('⚠️  DEMO MODE: Twilio credentials not configured');
            console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
            console.log('💡 To enable real SMS:');
            console.log('   1. Sign up at https://www.twilio.com/try-twilio');
            console.log('   2. Add credentials to .env file:');
            console.log('      TWILIO_ACCOUNT_SID=your_account_sid');
            console.log('      TWILIO_AUTH_TOKEN=your_auth_token');
            console.log('      TWILIO_PHONE_NUMBER=+1234567890');
            console.log('='.repeat(60) + '\n');

            return true;
        }
    } catch (error) {
        console.error('❌ Error sending OTP:', error.message);

        // In production, you might want to retry or use a fallback service
        // For now, log the OTP so the system doesn't break
        console.log(`📱 FALLBACK: OTP for ${phoneNumber}: ${otp}`);

        return true;
    }
}

/**
 * Check if user can request a new OTP (rate limiting)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user can request OTP
 */
async function canRequestOTP(userId) {
    try {
        const key = `otp:ratelimit:${userId}`;
        const count = await redisClient.get(key);

        if (!count) {
            // First request, allow and set rate limit
            await redisClient.setEx(key, 300, '1'); // 5 minutes, 1 request
            return true;
        }

        const requestCount = parseInt(count);

        if (requestCount >= 3) {
            return false; // Max 3 OTP requests per 5 minutes
        }

        // Increment counter
        await redisClient.incr(key);
        return true;
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return true; // Allow on error
    }
}

module.exports = {
    generateOTP,
    verifyOTP,
    sendOTP,
    canRequestOTP,
};
