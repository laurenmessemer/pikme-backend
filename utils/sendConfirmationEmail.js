const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

const sendConfirmationEmail = async (toEmail, username, token) => {
  const verifyUrl = `https://playpikme.com/verify-email?token=${token}`;

  try {
    await mailchimp.messages.send({
      message: {
        from_email: "noreply@playpikme.com",
        subject: "Verify your PikMe email ✉️",
        html: `
          <div style="font-family: sans-serif;">
            <h2>Welcome, ${username}!</h2>
            <p>Please verify your email to activate your PikMe account:</p>
            <a href="${verifyUrl}" style="background: #ff4d6d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
            <p>If you didn’t create a PikMe account, you can ignore this email.</p>
          </div>
        `,
        to: [{ email: toEmail, type: "to" }],
      },
    });
    console.log("✅ Confirmation email sent to", toEmail);
  } catch (err) {
    console.error("❌ Error sending confirmation email:", err);
  }
};

module.exports = sendConfirmationEmail;
