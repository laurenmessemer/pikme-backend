const moment = require('moment');
const { User, Competition, Wallet } = require('../models');
const { Op } = require('sequelize');
const { WeeklyTopVoters } = require('../models');

const voterReword = {
  1: 14,
  2: 8,
  3: 4,
};

/**
 * find the weekly top voters and add the winning amount in their wallet
 * @author Dhrumil Amrutiya (Zignuts)
 */
async function weeklyTopVoters() {
  try {
    const weekStart = moment()
      .startOf('isoWeek')
      .set({ hour: 0, minute: 0, second: 1, millisecond: 0 });

    const startOfWeek = weekStart.toDate();

    // Step 1: Fetch all competitions where user1 or user2 cast votes after startOfWeek
    const competitions = await Competition.findAll({
      where: {
        updatedAt: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    const voteMap = {};

    competitions.forEach((comp) => {
      if (comp.votes_user1) {
        voteMap[comp.user1_id] =
          (voteMap[comp.user1_id] || 0) + comp.votes_user1;
      }
      if (comp.user2_id && comp.votes_user2) {
        voteMap[comp.user2_id] =
          (voteMap[comp.user2_id] || 0) + comp.votes_user2;
      }
    });

    const voteArray = await Promise.all(
      Object.entries(voteMap).map(async ([id, count]) => {
        const user = await User.findByPk(id);
        return { id, username: user.username, count };
      })
    );

    const sorted = voteArray.sort((a, b) => b.count - a.count);

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
          type: 'Weekly Top Voter Reward!',
          description: `You earned the Weekly Top Voter Reward!: +${
            voterReword[i + 1]
          } tokens`,
          amount: voterReword[i + 1],
          timestamp: new Date(),
        },
      ];
      await winnerWallet.save();

      await WeeklyTopVoters.create({
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

module.exports = weeklyTopVoters;
