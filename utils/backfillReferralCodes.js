// backend/scripts/backfillReferralCodes.js
const { User } = require('../models');
const { sequelize } = require('../models');

const generateReferralCode = (id) => `PIK${id.toString().padStart(6, '0')}`;

const backfillReferralCodes = async () => {
  await sequelize.authenticate();
  const users = await User.findAll();

  for (const user of users) {
    if (!user.referral_code) {
      user.referral_code = generateReferralCode(user.id);
      await user.save();
    }
  }

  process.exit();
};

backfillReferralCodes();
