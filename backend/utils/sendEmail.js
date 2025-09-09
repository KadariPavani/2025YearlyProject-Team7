const createTransporter = require('../config/nodemailer');

const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: `InfoVerse Team <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;