const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

const sendInviteEmail = async (toEmail, inviterName, inviteCode) => {
  const inviteUrl = `https://www.pikme.com/join/upload/${inviteCode}`;

  try {
    const response = await mailchimp.messages.sendTemplate({
      template_name: "invite-template", // ✅ this should match the template slug in Mandrill
      template_content: [], // leave this empty if you're using merge tags
      message: {
        from_email: "hello@playpikme.com",
        from_name: "PikMe",
        to: [
          {
            email: toEmail,
            name: "Your Friend",
            type: "to",
          },
        ],
        subject: `${inviterName} invited you to a PikMe challenge!`,
        merge_language: "mailchimp",
        global_merge_vars: [
          {
            name: "INVITE_LINK",
            content: inviteUrl,
          },
          {
            name: "USERNAME",
            content: inviterName,
          },
          {
            name: "SUBJECT",
            content: `${inviterName} invited you to a PikMe challenge!`,
          },
        ],
      },
    });

    console.log("✅ Invite email sent to", toEmail);
    console.log("📬 Mandrill response:", response);
  } catch (err) {
    console.error("❌ Failed to send invite email:", err);
    if (err.response?.body) {
      console.error("📉 Mandrill API Error:", JSON.stringify(err.response.body, null, 2));
    }
  }
};

module.exports = sendInviteEmail;
