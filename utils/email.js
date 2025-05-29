const nodemailer = require('nodemailer');

async function sendTestEmail() {
  try {
    // Create a test email account
    const testAccount = await nodemailer.createTestAccount();

    // Create a transporter object
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Email details
    const mailOptions = {
      from: '"Test Sender" <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Hello from Ethereal',
      text: 'This is a test email',
      html: '<b>This is a test email</b>',
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('Error sending test email:', error.message);
    throw new Error('Error sending test email');
  }
}

module.exports = sendTestEmail;

// Uncomment this line to test directly by running this file:
// sendTestEmail().catch(console.error);
