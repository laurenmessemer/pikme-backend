const { Op, fn, col } = require('sequelize');
const { User, Competition, Vote } = require('../models');
const moment = require('moment');
exports.getTopVoters = async (req, res) => {
  try {
    const { userId } = req.query;

    // Get current time in New York timezone
    const now = moment.tz('America/New_York');

    // Get Sunday 00:00:00 of the current week in New York time
    const startOfWeek = now.clone().day(0).startOf('day').toDate();

    // const startOfWeek = new Date();
    // startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

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
        return {
          id,
          username: user.username,
          count,
          isUploaded: user.is_uploaded,
        };
      })
    );

    const sorted = voteArray.sort((a, b) => b.count - a.count);
    const me = sorted.find((user) => String(user.id) === String(userId)) || {
      username: 'Me',
      count: 0,
    };

    res.json({
      me,
      topVoters: sorted.slice(0, 10),
    });
  } catch (err) {
    console.error('❌ Error fetching top voters:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTopVotersV2 = async (req, res) => {
  try {
    const { userId } = req.query;

    // Get Sunday 00:00:00 of the current week in New York time
    const startOfWeek = moment
      .tz('America/New_York')
      .day(0)
      .startOf('day')
      .toDate();

    const topVotersList = await Vote.findAll({
      where: {
        createdAt: { [Op.gte]: startOfWeek },
        voter_id: { [Op.ne]: null },
      },
      attributes: ['voter_id', [fn('COUNT', col('voter_id')), 'voteCount']],
      group: ['voter_id', 'User.id'],
      order: [[fn('COUNT', col('voter_id')), 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'is_uploaded'],
          required: true,
        },
      ],
    });

    const topVoters = topVotersList.map((entry) => ({
      id: entry.voter_id,
      username: entry.User.username || 'Unknown',
      count: parseInt(entry.get('voteCount'), 10),
      isUploaded: entry.User.is_uploaded,
    }));

    // Find "me" stats
    const me = topVoters.find((user) => String(user.id) === String(userId)) || {
      username: 'Me',
      count: 0,
    };

    return res.status(200).json({
      me,
      topVoters: topVoters,
    });
  } catch (err) {
    console.error('Error fetching top voters:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTopReferrers = async (req, res) => {
  try {
    const { userId } = req.query;

    // Get current time in New York timezone
    const now = moment.tz('America/New_York');

    // Get Sunday 00:00:00 of the current week in New York time
    const startOfWeek = now.clone().day(0).startOf('day').toDate();

    // const startOfWeek = new Date();
    // startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

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
        return {
          id,
          username: user.username,
          count,
          isUploaded: user.is_uploaded,
        };
      })
    );

    const sorted = referralArray.sort((a, b) => b.count - a.count);
    const me = sorted.find((user) => String(user.id) === String(userId)) || {
      username: 'Me',
      count: 0,
    };

    res.json({
      me,
      topReferrers: sorted.slice(0, 10),
    });
  } catch (err) {
    console.error('❌ Error fetching top referrers:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
