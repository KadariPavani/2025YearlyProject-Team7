const nodemailer = require('nodemailer');

const createTransporter = () => {
  const hasEmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  if (!hasEmail) {
    // Return a noop transporter with compatible sendMail API
    return {
      sendMail: async (mailOptions) => {
        return Promise.resolve({ accepted: [], rejected: [], messageId: null });
      }
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // For development only - remove in production
    },
    debug: process.env.NODE_ENV === 'development'
  });

  // Verify transporter
  transporter.verify(function(error, success) {
    if (error) {
    } else {
    }
  });

  return transporter;
};

module.exports = createTransporter;