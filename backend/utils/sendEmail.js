const createTransporter = require('../config/nodemailer');

const sendEmail = async (options) => {
  try {
    // Validate email recipient
    if (!options.email) {
      throw new Error('Recipient email is required');
    }

    const transporter = createTransporter();

    const message = {
      from: `"InfoVerse Team" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject || 'InfoVerse Notification',
      html: options.message,
      text: options.text || '', // Fallback plain text
    };

    // Log email attempt
    console.log('Attempting to send email to:', options.email);

    const info = await transporter.sendMail(message);
    console.log('Email sent successfully:', info.messageId);
    return info;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = sendEmail;