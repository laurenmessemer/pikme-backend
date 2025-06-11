const { Op } = require('sequelize');
const { User, Competition } = require('../models');

exports.getTopVoters = async (req, res) => {
  try {
    const { userId } = req.query;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

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

exports.getTopReferrers = async (req, res) => {
  try {
    const { userId } = req.query;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

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
