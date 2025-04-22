const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

const sendInviteEmail = async (toEmail, inviterName, inviteCode) => {
  const inviteUrl = `https://www.pikme.com/join/upload/${inviteCode}`;

  await mailchimp.messages.send({
    message: {
      from_email: "hello@playpikme.com",
      from_name: "PikMe",
      to: [{ email: toEmail, type: "to" }],
      subject: `${inviterName} invited you to a PikMe challenge!`,
      text: `${inviterName} wants to face off! 🎯\n\nTap to upload your photo and join:\n${inviteUrl}`,
    },
  });

  console.log(`✅ Invite email sent to ${toEmail}`);
};

module.exports = sendInviteEmail;
