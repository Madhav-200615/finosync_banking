const nodemailer = require('nodemailer');

/**
 * FREE Email OTP Service
 * Uses Gmail SMTP (completely free!)
 * No cost, no limits for personal use
 */

/**
 * Send OTP via Email (FREE!)
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - Recipient name
 */
async function sendEmailOTP(email, otp, userName = 'User') {
  try {
    const gmailUser = process.env.EMAIL_USER;
    const gmailPassword = process.env.EMAIL_PASSWORD;

    console.log('--- EMAIL DEBUG ---');
    console.log('Sender:', gmailUser);
    console.log('Password Length:', gmailPassword ? gmailPassword.length : 0);
    console.log('Recipient:', email);
    console.log('-------------------');

    if (!gmailUser || !gmailPassword) {
      // Demo mode - log to console
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  DEMO MODE: Gmail credentials not configured');
      console.log(`📧 Email OTP for ${email}: ${otp}`);
      console.log('💡 To enable real emails (100% FREE):');
      console.log('   1. Use your Gmail account');
      console.log('   2. Enable 2-Factor Authentication');
      console.log('   3. Generate App Password:');
      console.log('      → myaccount.google.com/apppasswords');
      console.log('   4. Add to .env:');
      console.log('      GMAIL_USER=your-email@gmail.com');
      console.log('      GMAIL_APP_PASSWORD=your-16-char-password');
      console.log('='.repeat(60) + '\n');
      return true;
    }

    // Create transporter using Gmail (FREE!)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    // Email template
    const mailOptions = {
      from: `"FinoSync Banking" <${gmailUser}>`,
      to: email,
      subject: '🔐 Your OTP for Transaction Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { background: white; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #0a58ff; }
            .otp-box { background: #eef3ff; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #0a58ff; letter-spacing: 8px; }
            .info { color: #666; font-size: 14px; line-height: 1.6; }
            .warning { background: #fff3e0; padding: 15px; border-left: 4px solid #ffa500; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏦 FinoSync</div>
              <p style="color: #666;">Secure Banking Platform</p>
            </div>
            
            <h2 style="color: #333;">Hi ${userName},</h2>
            <p class="info">You requested an OTP to verify your transaction. Use the code below to proceed:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 5 minutes</p>
            </div>
            
            <p class="info">
              If you didn't request this OTP, please ignore this email and ensure your account is secure.
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              Never share your OTP with anyone. FinoSync staff will never ask for your OTP.
            </div>
            
            <div class="footer">
              <p>© 2025 FinoSync Banking. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email OTP sent successfully to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return true;

  } catch (error) {
    console.error('❌ Error sending email OTP:', error.message);
    console.log(`📧 FALLBACK: OTP for ${email}: ${otp}`);
    return true;
  }
}

module.exports = {
  sendEmailOTP
};
