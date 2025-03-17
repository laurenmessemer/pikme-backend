const nodemailer = require("nodemailer");

const PIKME_BASE_URL = "https://pikme.com"; // Replace with your actual website URL

/** ✅ Generate a random 8-character invite code */
const generateInviteCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

/** ✅ Send an invite email including sign-up/login links */
const sendInviteEmail = async (recipientEmail, inviteCode, contestId) => {
  try {
    // 1️⃣ Create a test email account (Ethereal)
    const testAccount = await nodemailer.createTestAccount();

    console.log("📩 Ethereal Test Account:");
    console.log("User:", testAccount.user);
    console.log("Pass:", testAccount.pass);

    // 2️⃣ Create a transporter object
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // 3️⃣ Build CTA Links
    const signUpLink = `${PIKME_BASE_URL}/signup`;
    const loginLink = `${PIKME_BASE_URL}/login`;
    const contestJoinLink = `${PIKME_BASE_URL}/contest/join?invite_code=${inviteCode}&contest_id=${contestId}`;

    // 4️⃣ Email details with CTA buttons
    const mailOptions = {
      from: '"PikMe Invite" <invite@example.com>',
      to: recipientEmail,
      subject: "You're Invited to a Head-to-Head Contest on PikMe!",
      text: `You've been invited to join a contest on PikMe!\n
             Use this invite code: ${inviteCode}\n
             Sign up: ${signUpLink}\n
             Log in: ${loginLink}\n
             Join the contest directly: ${contestJoinLink}`,
      html: `
        <h2>You're Invited to a Head-to-Head Contest!</h2>
        <p><strong>Your Invite Code:</strong> <code>${inviteCode}</code></p>
        <p>Click below to sign up or log in and join the contest:</p>
        <p>
          <a href="${signUpLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#28a745;text-decoration:none;border-radius:5px;">Sign Up</a>
          <a href="${loginLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;text-decoration:none;border-radius:5px;margin-left:10px;">Log In</a>
        </p>
        <p>Or click here to join the contest directly:</p>
        <p>
          <a href="${contestJoinLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#ff5722;text-decoration:none;border-radius:5px;">Join Contest</a>
        </p>
      `,
    };

    // 5️⃣ Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Invite Email Sent: %s", info.messageId);
    console.log("🔗 Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return { messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error("❌ Error sending invite email:", error.message);
    throw new Error("Error sending invite email");
  }
};

module.exports = { generateInviteCode, sendInviteEmail };
