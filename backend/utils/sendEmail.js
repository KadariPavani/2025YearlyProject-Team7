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

    const info = await transporter.sendMail(message);
    return info;

  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;