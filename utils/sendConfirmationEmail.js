const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

const sendConfirmationEmail = async (toEmail, username, token) => {
  const verifyUrl = `https://playpikme.com/verify-email?token=${token}`;

  try {
    await mailchimp.messages.sendTemplate({
      template_name: "email-confirmation-v2", // ✅ your Mandrill template name
      template_content: [], // not needed unless you're injecting dynamic blocks
      message: {
        from_email: "hello@playpikme.com", // ✅ make sure it's your authenticated sender
        from_name: "PikMe",
        to: [
          {
            email: toEmail,
            name: username,
            type: "to",
          },
        ],
        subject: "Verify your PikMe email ✉️",
        global_merge_vars: [
          {
            name: "VERIFICATION_URL", // 👈 matches *|VERIFICATION_URL|* in the template
            content: verifyUrl,
          },
        ],
      },
    });

    console.log("✅ Fancy confirmation email sent to", toEmail);
  } catch (err) {
    console.error("❌ Error sending confirmation email:", err.response?.body || err);
  }
};

module.exports = sendConfirmationEmail;
