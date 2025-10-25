const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
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
      console.error('Nodemailer transporter verification failed:', error);
    } else {
      console.log('Nodemailer transporter is ready to send emails');
    }
  });

  return transporter;
};

module.exports = createTransporter;