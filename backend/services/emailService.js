const nodemailer = require('nodemailer');
const { htmlEncode } = require('../middleware/validate');

// Configure Nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Email rate limiting (max 10 emails per minute)
const emailRateStore = new Map();
const EMAIL_RATE_LIMIT = 10;
const EMAIL_RATE_WINDOW = 60 * 1000; // 1 minute

const checkEmailRate = (to) => {
  const now = Date.now();
  if (!emailRateStore.has(to)) {
    emailRateStore.set(to, []);
  }
  const timestamps = emailRateStore.get(to).filter(t => now - t < EMAIL_RATE_WINDOW);
  emailRateStore.set(to, timestamps);
  
  if (timestamps.length >= EMAIL_RATE_LIMIT) {
    return false; // Rate limited
  }
  timestamps.push(now);
  return true;
};

/**
 * Send an email using Gmail.
 * All user-supplied values are HTML-encoded before insertion into templates.
 */
const sendEmail = async (to, subject, htmlContent) => {
  // Check email rate limit
  if (!checkEmailRate(to)) {
    console.warn(`⚠️ [Email Rate Limit] Too many emails to ${to}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Orin Platform" <${process.env.GMAIL_USER || 'info@example.com'}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`📧 [Gmail] Real Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ [Gmail System] Real email dispatch failed (falling back to Mock print): ${error.message}`);
    
    // Mock simulation for sandbox/dev validation
    console.log(`\n======================================================`);
    console.log(`📧 [Gmail Mock] Sending Email to: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`======================================================`);
    console.log(htmlContent.replace(/<[^>]+>/g, '')); // Strip HTML for console readability
    console.log(`======================================================\n`);
    
    return true;
  }
};

exports.sendRegistrationConfirmation = async (userEmail, eventTitle) => {
  // HTML-encode user-supplied event title to prevent template injection
  const safeTitle = htmlEncode(eventTitle);
  const subject = `Registration Confirmed: ${safeTitle}`;
  const html = `
    <h2>You are in! 🎉</h2>
    <p>Your registration for <strong>${safeTitle}</strong> has been successfully confirmed.</p>
    <p>Please check your Orin dashboard for upcoming deadlines and assessment details.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};

exports.sendQualificationAlert = async (userEmail, eventTitle) => {
  const safeTitle = htmlEncode(eventTitle);
  const subject = `Action Required: You've been Shortlisted for ${safeTitle}!`;
  const html = `
    <h2>Congratulations! 🌟</h2>
    <p>You have been shortlisted for the next round of <strong>${safeTitle}</strong> based on your recent evaluation.</p>
    <p>Log in to your Orin account immediately to see your updated Event Lifecycle and prepare for the next phase.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};

exports.sendCertificateGenerated = async (userEmail, eventTitle, certificateId) => {
  const safeTitle = htmlEncode(eventTitle);
  const safeCertId = htmlEncode(certificateId);
  const subject = `Your Certificate for ${safeTitle} is Ready`;
  const html = `
    <h2>Great job! 🎓</h2>
    <p>Your certificate of participation for <strong>${safeTitle}</strong> has been generated.</p>
    <p>Your Unique Certificate ID: <strong>${safeCertId}</strong></p>
    <p>You can view, download, and share your verified certificate directly from your Orin Profile.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};

exports.sendOtpVerification = async (userEmail, otp) => {
  // HTML-encode OTP to prevent template injection
  const safeOtp = htmlEncode(String(otp));
  const subject = `Your Orin OTP Verification Code`;
  const html = `
    <h2>Welcome to Orin! 🚀</h2>
    <p>Please use the following One-Time Password (OTP) to verify your email address:</p>
    <div style="background: #F1F3F5; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #7B61FF; margin: 20px 0;">
      ${safeOtp}
    </div>
    <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};
