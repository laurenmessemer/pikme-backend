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

    function getRandomTen(data) {
      // Shuffle the array
      const shuffled = data.sort(() => 0.5 - Math.random());
      // Return first 10 elements
      return shuffled.slice(0, 10);
    }

    // Static data
    const users = [
      { id: 134, username: 'maxine112', count: 7, isUploaded: true },
      { id: 135, username: 'tony846', count: 13, isUploaded: true },
      { id: 136, username: 'zoey778', count: 3, isUploaded: true },
      { id: 137, username: 'kai009', count: 13, isUploaded: true },
      { id: 138, username: 'nina247', count: 1, isUploaded: true },
      { id: 139, username: 'sammy808', count: 11, isUploaded: true },
      { id: 140, username: 'bobby132', count: 9, isUploaded: true },
      { id: 141, username: 'grace420', count: 5, isUploaded: true },
      { id: 142, username: 'dexter303', count: 13, isUploaded: true },
      { id: 143, username: 'ruby502', count: 4, isUploaded: true },
      { id: 144, username: 'leo721', count: 13, isUploaded: true },
      { id: 145, username: 'mia656', count: 6, isUploaded: true },
      { id: 146, username: 'oliver989', count: 13, isUploaded: true },
      { id: 147, username: 'ava313', count: 2, isUploaded: true },
      { id: 148, username: 'lucas002', count: 13, isUploaded: true },
      { id: 149, username: 'ella794', count: 10, isUploaded: true },
      { id: 150, username: 'noah223', count: 8, isUploaded: true },
      { id: 151, username: 'lily555', count: 13, isUploaded: true },
      { id: 152, username: 'jack430', count: 3, isUploaded: true },
      { id: 153, username: 'sophia381', count: 6, isUploaded: true },
      { id: 154, username: 'logan903', count: 12, isUploaded: true },
      { id: 155, username: 'chloe110', count: 1, isUploaded: true },
      { id: 156, username: 'ethan744', count: 13, isUploaded: true },
      { id: 157, username: 'harper317', count: 9, isUploaded: true },
    ];

    const topVoters = topVotersList.map((entry) => ({
      id: entry.voter_id,
      username: entry.User.username || 'Unknown',
      count: parseInt(entry.get('voteCount'), 10),
      isUploaded: entry.User.is_uploaded,
    }));

    let randomTen = [];

    if (topVoters.length < 10) {
      randomTen = getRandomTen(users, 10 - Number(topVoters.length));
    }

    // const randomTen = getRandomTen(users);

    // Step 3: Combine both arrays
    const combinedList = [...randomTen, ...topVoters];

    // Step 4: Sort by `count` descending
    const sortedByCount = combinedList.sort((a, b) => {
      // Prioritize isUploaded = true
      if (a.isUploaded !== b.isUploaded) {
        return a.isUploaded - b.isUploaded; // false first
      }

      // If both have same isUploaded, sort by count descending
      return b.count - a.count;
    });

    // Step 5: Pick top 10
    const top10Combined = sortedByCount.slice(0, 10);

    const sorted = top10Combined.sort((a, b) => b.count - a.count);
    // Find "me" stats
    const me = sorted.find((user) => String(user.id) === String(userId)) || {
      username: 'Me',
      count: 0,
    };

    return res.status(200).json({
      me,
      topVoters: sorted,
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

    function getRandomTen(data, number) {
      // Shuffle the array
      const shuffled = data.sort(() => 0.5 - Math.random());
      // Return first 10 elements
      return shuffled.slice(0, number);
    }

    // Static data
    const users = [
      { id: 134, username: 'nova_dreamer', count: 1, isUploaded: true },
      { id: 135, username: 'echo_blaze', count: 1, isUploaded: true },
      { id: 136, username: 'skyline_zara', count: 1, isUploaded: true },
      { id: 137, username: 'crimson_dash', count: 1, isUploaded: true },
      { id: 138, username: 'pixel_ace', count: 1, isUploaded: true },
      { id: 139, username: 'luna_glow', count: 1, isUploaded: true },
      { id: 140, username: 'cyber_milo', count: 1, isUploaded: true },
      { id: 141, username: 'frostbyte7', count: 1, isUploaded: true },
      { id: 141, username: 'twilight_echo', count: 1, isUploaded: true },
      { id: 143, username: 'neon_raze', count: 1, isUploaded: true },
      { id: 144, username: 'blaze_quinn', count: 1, isUploaded: true },
      { id: 145, username: 'stella_rush', count: 1, isUploaded: true },
      { id: 146, username: 'vortex_ryder', count: 1, isUploaded: true },
      { id: 147, username: 'ivy_circuit', count: 1, isUploaded: true },
      { id: 148, username: 'ember_sage', count: 1, isUploaded: true },
      { id: 149, username: 'cosmo_nyx', count: 1, isUploaded: true },
      { id: 150, username: 'astro_knox', count: 1, isUploaded: true },
      { id: 151, username: 'zephyr_lux', count: 1, isUploaded: true },
      { id: 151, username: 'onyx_jett', count: 1, isUploaded: true },
      { id: 153, username: 'nova_ray', count: 1, isUploaded: true },
      { id: 154, username: 'vega_muse', count: 1, isUploaded: true },
      { id: 155, username: 'flare_zen', count: 1, isUploaded: true },
      { id: 156, username: 'orbit_kai', count: 1, isUploaded: true },
      { id: 157, username: 'eclipse_zed', count: 1, isUploaded: true },
    ];

    let randomTen = [];

    if (referralArray.length < 10) {
      randomTen = getRandomTen(users, 10 - Number(referralArray.length));
    }

    // Step 3: Combine both arrays
    const combinedList = [...randomTen, ...referralArray];

    // Step 4: Sort by `count` descending
    const sortedByCount = combinedList.sort((a, b) => {
      // Prioritize isUploaded = true
      if (a.isUploaded !== b.isUploaded) {
        return a.isUploaded - b.isUploaded; // false first
      }

      // If both have same isUploaded, sort by count descending
      return b.count - a.count;
    });

    // Step 5: Pick top 10
    const top10Combined = sortedByCount.slice(0, 10);

    const sorted = top10Combined.sort((a, b) => b.count - a.count);
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
