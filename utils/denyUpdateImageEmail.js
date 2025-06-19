const mailchimp = require('@mailchimp/mailchimp_transactional')(
  process.env.MAILCHIMP_TRANSACTIONAL_KEY
);

/**
 * send the Email on the Admin Deny the preplaced the violation image
 * @author Dhrumil Amrutiya (Zignuts)
 */
const denyUpdateImageEmail = async (
  email,
  username,
  competitionId,
  themeName
) => {
  try {
    let imageUpdatePageLink = `${process.env.FRONTEND_URL}leaderboard/ReportedSubmission?competitionId=${competitionId}`;

    const response = await mailchimp.messages.sendTemplate({
      template_name: 'deny-updated-image-template', // ✅ this should match the template slug in Mandrill
      template_content: [], // leave this empty if you're using merge tags
      message: {
        from_email: 'hello@playpikme.com',
        from_name: 'PikMe',
        to: [
          {
            // email: email,
            email: email,
            name: 'Your Friend',
            type: 'to',
          },
        ],
        subject: 'Action Required: Your Replaced Image Was Denied',
        merge_language: 'mailchimp',
        global_merge_vars: [
          {
            name: 'VERIFICATION_URL',
            content: imageUpdatePageLink,
          },
          {
            name: 'USERNAME',
            content: username,
          },
          {
            name: 'THEME',
            content: themeName,
          },
        ],
      },
    });
  } catch (error) {
    console.error('❌ Error determining winners:', error);
    return {
      success: false,
      error: error,
      message: 'Server error while determining winners.',
    };
  }
};

module.exports = denyUpdateImageEmail;
