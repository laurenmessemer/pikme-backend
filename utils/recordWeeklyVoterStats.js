const { Vote, WeeklyVoterStats } = require('../models');
const { Sequelize } = require('sequelize');
const moment = require('moment');
const { User } = require('../models');

/**
 * Record the last week votes stats
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.recordWeeklyVoterStats = async () => {
  // Get current date
  const today = moment.tz('America/New_York');

  // Get the previous week's Monday 00:00:00
  const lastWeekStart = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'week')
    .startOf('day')
    .toDate();

  // Get the previous week's Sunday 23:59:59
  const lastWeekEnd = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'day')
    .endOf('day')
    .toDate();

  // return true;
  try {
    // Fetch all voters and their first vote times, grouped by voter
    const voters = await Vote.findAll({
      attributes: [
        'voter_id',
        [Sequelize.fn('MIN', Sequelize.col('Vote.createdAt')), 'first_vote'],
      ],
      include: [
        {
          model: User,
          where: {
            is_uploaded: false,
          },
          attributes: [],
        },
      ],
      group: ['voter_id'],
      raw: true,
    });

    const newVoterIds = new Set();
    const repeatVoterIds = new Set();

    for (const voter of voters) {
      const firstVote = new Date(voter.first_vote);
      if (firstVote >= lastWeekStart && firstVote < lastWeekEnd) {
        newVoterIds.add(voter.voter_id);
      } else {
        // Check if they voted again during last week
        const recentVote = await Vote.findOne({
          where: {
            voter_id: voter.voter_id,
            createdAt: {
              [Sequelize.Op.gte]: lastWeekStart,
              [Sequelize.Op.lt]: lastWeekEnd,
            },
          },
        });
        if (recentVote) {
          repeatVoterIds.add(voter.voter_id);
        }
      }
    }

    // Insert or update the weekly stats record
    await WeeklyVoterStats.upsert({
      weekStart: lastWeekStart.toISOString().slice(0, 10),
      newVoters: newVoterIds.size,
      repeatVoters: repeatVoterIds.size,
    });
  } catch (err) {
    console.error('❌ Error in recordWeeklyVoterStats:', err);
    throw err;
  }
};
