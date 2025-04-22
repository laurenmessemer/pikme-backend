require("dotenv").config();
console.log("📛 API Key Loaded:", process.env.MAILCHIMP_TRANSACTIONAL_KEY ? "✅ Present" : "❌ MISSING");
const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

const sendConfirmationEmail = async () => {
  const toEmail = "lauren1188@gmail.com";

  try {
    const response = await mailchimp.messages.send({
      message: {
        from_email: "hello@playpikme.com",
        from_name: "PikMe",
        to: [{ email: toEmail, type: "to" }],
        subject: "Test Email from PikMe",
        text: "This is a plain text test email.",
      },
    });

    console.log("✅ Sent!", response);
  } catch (err) {
    console.error("❌ Failed to send:", err.response?.data || err);
  }
};

sendConfirmationEmail();
