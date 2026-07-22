const nodemailer = require('nodemailer');

// Configure Nodemailer with Gmail
// To use this in production, replace with actual App Password from Google Account
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/**
 * Send an email using Gmail
 * (In this dev environment, it will simulate a success log if credentials fail)
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Attempt to send real email
    // const info = await transporter.sendMail({
    //   from: '"Orin Platform" <info@example.com>',
    //   to,
    //   subject,
    //   html: htmlContent
    // });
    // console.log(`📧 [Gmail] Real Email sent to ${to}: ${info.messageId}`);
    
    // For this demo, we will simulate the send to avoid crashing without real credentials
    console.log(`\n======================================================`);
    console.log(`📧 [Gmail Mock] Sending Email to: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`======================================================`);
    console.log(htmlContent.replace(/<[^>]+>/g, '')); // Strip HTML for console readability
    console.log(`======================================================\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ [Gmail Error] Failed to send email to ${to}`, error);
    return false;
  }
};

exports.sendRegistrationConfirmation = async (userEmail, eventTitle) => {
  const subject = `Registration Confirmed: ${eventTitle}`;
  const html = `
    <h2>You are in! 🎉</h2>
    <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
    <p>Please check your Orin dashboard for upcoming deadlines and assessment details.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};

exports.sendQualificationAlert = async (userEmail, eventTitle) => {
  const subject = `Action Required: You've been Shortlisted for ${eventTitle}!`;
  const html = `
    <h2>Congratulations! 🌟</h2>
    <p>You have been shortlisted for the next round of <strong>${eventTitle}</strong> based on your recent evaluation.</p>
    <p>Log in to your Orin account immediately to see your updated Event Lifecycle and prepare for the next phase.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};

exports.sendCertificateGenerated = async (userEmail, eventTitle, certificateId) => {
  const subject = `Your Certificate for ${eventTitle} is Ready`;
  const html = `
    <h2>Great job! 🎓</h2>
    <p>Your certificate of participation for <strong>${eventTitle}</strong> has been generated.</p>
    <p>Your Unique Certificate ID: <strong>${certificateId}</strong></p>
    <p>You can view, download, and share your verified certificate directly from your Orin Profile.</p>
    <br/>
    <p>Best regards,</p>
    <p>The Orin Team</p>
  `;
  return sendEmail(userEmail, subject, html);
};
