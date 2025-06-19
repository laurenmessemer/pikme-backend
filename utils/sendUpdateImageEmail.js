const mailchimp = require('@mailchimp/mailchimp_transactional')(
  process.env.MAILCHIMP_TRANSACTIONAL_KEY
);

<<<<<<< HEAD
=======
/**
 * Send the email to the reported user for the violation
 * @author Dhrumil Amrutiya (Zignuts)
 */
>>>>>>> 42d08cd414e6704fbdfe8488d52381be928fa917
const sendUpdateImageEmail = async (
  email,
  username,
  competitionId,
  themeName
) => {
  try {
    let imageUpdatePageLink = `${process.env.FRONTEND_URL}leaderboard/ReportedSubmission?competitionId=${competitionId}`;

    const response = await mailchimp.messages.sendTemplate({
      template_name: 'update-image-template', // ✅ this should match the template slug in Mandrill
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
        subject: `Your Image Was Reported - Action Needed Within 24 Hours`,
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
<<<<<<< HEAD
    console.dir(response, { depth: null });
=======
>>>>>>> 42d08cd414e6704fbdfe8488d52381be928fa917
  } catch (error) {
    console.log('error: ', error);
    console.error('❌ Error determining winners:', error);
    return {
      success: false,
      error: error,
      message: 'Server error while determining winners.',
    };
  }
};

module.exports = sendUpdateImageEmail;
