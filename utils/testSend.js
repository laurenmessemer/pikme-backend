const mailchimp = require("@mailchimp/mailchimp_transactional")("md-ghenRxKxpCsZ-VeELfh-nQ");
console.log("📛 API Key Loaded:", "md-ghenRxKxpCsZ-VeELfh-nQ" ? "✅ OK" : "❌❌ MISSING");

const sendConfirmationEmail = async () => {
  const toEmail = "lauren1188@gmail.com";

  try {
    const response = await mailchimp.messages.send({
      message: {
        from_email: "sandbox@mandrillapp.com",
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
