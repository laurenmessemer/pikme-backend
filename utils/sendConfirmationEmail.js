// const mailchimp = require("@mailchimp/mailchimp_transactional")(process.env.MAILCHIMP_TRANSACTIONAL_KEY);

// const sendConfirmationEmail = async (toEmail, username, token) => {
//   const verifyUrl = `https://playpikme.com/verify-email?token=${token}`;

//   // 🔍 Debug: Log what we're sending
//   console.log("📧 Preparing to send email with:");
//   console.log("📤 To:", toEmail);
//   console.log("👤 Username:", username);
//   console.log("🔗 Verification URL:", verifyUrl);
//   console.log("📦 Template Name:", "email-confirmation-template");

//   try {
//     const response = await mailchimp.messages.sendTemplate({
//       template_name: "email-confirmation-template", // must exactly match Mailchimp template slug
//       template_content: [], // unused unless using content blocks
//       message: {
//         from_email: "hello@playpikme.com", // must be authenticated in Mandrill
//         from_name: "PikMe",
//         to: [
//           {
//             email: toEmail,
//             name: username || "Photographer",
//             type: "to",
//           },
//         ],
//         subject: "Verify your PikMe email ✉️",
//         merge_language: "mailchimp", // supports *|MERGE|* style tags
//         global_merge_vars: [
//           {
//             name: "VERIFICATION_URL", // must match *|VERIFICATION_URL|* in template
//             content: verifyUrl,
//           },
//           {
//             name: "SUBJECT", // used in *|SUBJECT:...|* if set in template title
//             content: "Verify your PikMe email ✉️",
//           },
//         ],
//       },
//     });

//     console.log("✅ Fancy confirmation email sent to", toEmail);
//     console.log("📬 Mandrill response:", response);
//   } catch (err) {
//     console.error("❌ Email sending failed:");
//     if (err.response?.body) {
//       console.error("📉 Mandrill API Error:", JSON.stringify(err.response.body, null, 2));
//     } else {
//       console.error(err);
//     }
//   }
// };

// module.exports = sendConfirmationEmail;
