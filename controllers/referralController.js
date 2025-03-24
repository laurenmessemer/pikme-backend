const mailgun = require("mailgun-js");
const { User } = require("../models");

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

exports.sendReferralEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const referringUser = await User.findByPk(req.user.id);

    if (!referringUser || !referringUser.referral_code) {
      return res.status(400).json({ message: "Referral code not found" });
    }

    const referralLink = `${process.env.FRONTEND_URL}/signup?ref=${referringUser.referral_code}`;

    const emailData = {
      from: "PikMe <referrals@yourdomain.com>",
      to: email,
      subject: `${referringUser.username} invited you to join PikMe!`,
      text: `Join PikMe and get 10 tokens! Sign up here: ${referralLink}`,
      html: `<p>${referringUser.username} invited you to join <strong>PikMe</strong>!</p>
             <p>Click <a href="${referralLink}">here</a> to join and get your tokens.</p>`,
    };

    await mg.messages().send(emailData);
    res.status(200).json({ message: "Referral email sent successfully" });
  } catch (err) {
    console.error("❌ Error sending referral email:", err.message);
    res.status(500).json({ message: "Failed to send referral email", error: err.message });
  }
};
