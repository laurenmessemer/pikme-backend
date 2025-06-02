const moment = require('moment');
const { User, Competition, Wallet } = require('../models');
const { Op } = require('sequelize');
const { WeeklyTopReferrers } = require('../models');

const voterReword = {
  1: 14,
  2: 8,
  3: 4,
};

async function weeklyTopReferrers() {
  try {
    const weekStart = moment()
      .startOf('isoWeek')
      .set({ hour: 0, minute: 0, second: 1, millisecond: 0 });

    const startOfWeek = weekStart.toDate();

    // Step 1: Get users created this week that have referred_by_id
    const referrals = await User.findAll({
      where: {
        createdAt: {
          [Op.gte]: startOfWeek,
        },
        referred_by_id: {
          [Op.ne]: null,
        },
      },
    });

    const referralMap = {};

    referrals.forEach((user) => {
      const refId = user.referred_by_id;
      referralMap[refId] = (referralMap[refId] || 0) + 1;
    });

    const referralArray = await Promise.all(
      Object.entries(referralMap).map(async ([id, count]) => {
        const user = await User.findByPk(id);
        return { id, username: user.username, count };
      })
    );

    const sorted = referralArray.sort((a, b) => b.count - a.count);

    for (let i = 0; i < sorted.length; i++) {
      const voter = sorted[i];
      const findUser = await User.findByPk(voter.id);
      const winnerWallet = await Wallet.findOne({
        where: { user_id: findUser.id },
      });

      // ✅update wallet
      winnerWallet.token_balance += voterReword[i + 1];
      winnerWallet.transaction_history = [
        ...(winnerWallet.transaction_history || []),
        {
          type: 'Weekly Top Referrers',
          description: `You earned the Weekly Top Referrers Reward!: +${
            voterReword[i + 1]
          } tokens`,
          amount: voterReword[i + 1],
          timestamp: new Date(),
        },
      ];
      await winnerWallet.save();

      await WeeklyTopReferrers.create({
        position: i + 1,
        user_id: findUser.id,
        winning_amount: voterReword[i + 1],
      });

      if (i == 2) {
        break;
      }
    }

    return {
      isError: false,
    };
  } catch (error) {
    console.log('error: ', error);
    throw new Error('Error Top Voters');
  }
}

module.exports = weeklyTopReferrers;
