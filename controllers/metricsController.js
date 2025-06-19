const {
  Vote,
  User,
  Competition,
  Contest,
  WeeklyVoterStats,
  WeeklyCompetitorStats,
  WeeklyReportStats,
} = require('../models');
const { getDateFilters } = require('../utils/metricsUtils');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const {
  recordWeeklyCompetitorStats,
} = require('../utils/recordWeeklyCompetitorStats');
const { recordWeeklyVoterStats } = require('../utils/recordWeeklyVoterStats');
const { recordWeeklyReportStats } = require('../utils/recordWeeklyReportStats');

exports.getVoteMetrics = async (req, res) => {
  const { userId } = req.params;
  const dateFilters = getDateFilters();

  try {
    const metrics = {};

    for (const [interval, filter] of Object.entries(dateFilters)) {
      metrics[interval] = await Vote.count({
        where: {
          voter_id: userId,
          ...filter,
        },
      });
    }

    res.json(metrics);
  } catch (err) {
    console.error('Error fetching vote metrics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAvgVotesPerUser = async (req, res) => {
  const dateFilters = getDateFilters();
  const metrics = {};

  try {
    for (const [interval, filter] of Object.entries(dateFilters)) {
      // Total votes in interval
      const totalVotes = await Vote.count({
        where: { ...filter },
        include: [
          {
            model: User,
            as: 'User',
            where: {
              is_uploaded: false,
            },
            attributes: [], // exclude User fields from result
          },
        ],
      });

      // Unique users who cast votes in that interval
      const uniqueVoters = await Vote.count({
        where: { ...filter },
        include: [
          {
            model: User,
            where: {
              is_uploaded: false,
            },
            attributes: [], // exclude User fields from result
          },
        ],
        distinct: true,
        col: 'voter_id',
      });

      metrics[interval] = {
        totalVotes,
        uniqueVoters,
        avgVotesPerUser:
          uniqueVoters > 0 ? (totalVotes / uniqueVoters).toFixed(2) : '0.00',
      };
    }

    res.json(metrics);
  } catch (err) {
    console.error('❌ Error in getAvgVotesPerUser:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getVotingUserPercentage = async (req, res) => {
  const dateFilters = getDateFilters();
  const result = {};

  try {
    // Total user count (can adjust to exclude suspended users if desired)
    const totalUsers = await User.count({
      where: {
        role: 'participant', // or any roles you want to include
        suspended: false,
        is_uploaded: false,
      },
    });

    for (const [interval, filter] of Object.entries(dateFilters)) {
      // Count distinct voters in that interval
      const voters = await Vote.count({
        where: { ...filter },
        include: [
          {
            model: User,
            as: 'User',
            where: {
              is_uploaded: false,
            },
            attributes: [], // exclude User fields from result
          },
        ],
        distinct: true,
        col: 'voter_id',
      });

      const percentage =
        totalUsers > 0 ? ((voters / totalUsers) * 100).toFixed(2) : '0.00';

      result[interval] = {
        uniqueVoters: voters,
        totalUsers,
        votingUserPercentage: percentage,
      };
    }

    res.json(result);
  } catch (err) {
    console.error('❌ Error in getVotingUserPercentage:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getCurrentCompetingUsers = async (req, res) => {
  try {
    // Get total eligible users
    const totalUsers = await User.count({
      where: {
        role: 'participant',
        suspended: false,
        is_uploaded: false,
      },
    });

    // Get all Live or Upcoming contests
    const activeContests = await Contest.findAll({
      where: {
        status: {
          [Op.in]: ['Live', 'Upcoming'],
        },
      },
    });

    const contestIds = activeContests.map((c) => c.id);

    if (contestIds.length === 0) {
      return res.json({
        competingUsers: 0,
        totalUsers,
        percentage: '0.00',
      });
    }

    // Find all competitions tied to those contests
    const competitions = await Competition.findAll({
      where: {
        contest_id: { [Op.in]: contestIds },
      },
      include: [
        {
          model: User,
          as: 'User1',
          where: { is_uploaded: false },
          attributes: [],
        },
        {
          model: User,
          as: 'User2',
          where: { is_uploaded: false },
          attributes: [],
          required: false, // optional if user2 is nullable
        },
      ],
    });

    const uniqueUserIds = new Set();
    competitions.forEach((comp) => {
      if (comp.user1_id) uniqueUserIds.add(comp.user1_id);
      if (comp.user2_id) uniqueUserIds.add(comp.user2_id);
    });

    const count = uniqueUserIds.size;
    const percent =
      totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : '0.00';

    res.json({
      competingUsers: count,
      totalUsers,
      percentage: percent,
    });
  } catch (err) {
    console.error('❌ Error in getCurrentCompetingUsers:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getVotingAndCompetingStats = async (req, res) => {
  try {
    // 🔹 Total active users
    const totalUsers = await User.findAll({
      where: {
        role: 'participant',
        suspended: false,
        is_uploaded: false,
      },
      attributes: ['id'],
      raw: true,
    });
    const totalUserIds = totalUsers.map((u) => u.id);

    // 🔹 Users who have voted
    const votedUsers = await Vote.findAll({
      attributes: ['voter_id'],
      include: [
        {
          model: User,
          where: { is_uploaded: false },
          attributes: [],
        },
      ],
      group: ['voter_id'],
      raw: true,
    });
    const votedUserIds = new Set(votedUsers.map((v) => v.voter_id));

    // 🔹 Users who have competed (all-time)
    const allCompetitions = await Competition.findAll({
      attributes: ['user1_id', 'user2_id'],
      include: [
        {
          model: User,
          as: 'User1',
          where: { is_uploaded: false },
          attributes: [],
        },
        {
          model: User,
          as: 'User2',
          where: { is_uploaded: false },
          attributes: [],
          required: false, // optional if user2 is nullable
        },
      ],
      raw: true,
    });

    const competedUserIds = new Set();
    allCompetitions.forEach((comp) => {
      if (comp.user1_id) competedUserIds.add(comp.user1_id);
      if (comp.user2_id) competedUserIds.add(comp.user2_id);
    });

    // 🔹 Users who are currently competing (Live or Upcoming)
    const activeCompetitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          where: {
            status: { [Op.in]: ['Live', 'Upcoming'] },
          },
        },
        {
          model: User,
          as: 'User1',
          where: { is_uploaded: false },
          attributes: [],
        },
        {
          model: User,
          as: 'User2',
          where: { is_uploaded: false },
          attributes: [],
          required: false, // optional if user2 is nullable
        },
      ],
      attributes: ['user1_id', 'user2_id'],
      raw: true,
    });

    const currentlyCompetingUserIds = new Set();
    activeCompetitions.forEach((comp) => {
      if (comp.user1_id) currentlyCompetingUserIds.add(comp.user1_id);
      if (comp.user2_id) currentlyCompetingUserIds.add(comp.user2_id);
    });

    // 🔹 Intersections
    const currentBoth = Array.from(currentlyCompetingUserIds).filter((id) =>
      votedUserIds.has(id)
    );
    const allTimeBoth = Array.from(competedUserIds).filter((id) =>
      votedUserIds.has(id)
    );

    const totalCount = totalUserIds.length;

    res.json({
      current: {
        both: currentBoth.length,
        totalUsers: totalCount,
        percentage:
          totalCount > 0
            ? ((currentBoth.length / totalCount) * 100).toFixed(2)
            : '0.00',
      },
      all_time: {
        both: allTimeBoth.length,
        totalUsers: totalCount,
        percentage:
          totalCount > 0
            ? ((allTimeBoth.length / totalCount) * 100).toFixed(2)
            : '0.00',
      },
    });
  } catch (err) {
    console.error('❌ Error in getVotingAndCompetingStats:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getVoterToCompetitorRatio = async (req, res) => {
  try {
    const totalUsers = await User.count({
      where: { role: 'participant', suspended: false, is_uploaded: false },
    });

    // All-time unique voters
    const allTimeVoters = await Vote.count({
      include: [
        {
          model: User,
          where: {
            is_uploaded: false,
          },
          attributes: [],
        },
      ],
      distinct: true,
      col: 'voter_id',
    });

    // All-time unique competitors
    const allTimeCompetitorsRaw = await Competition.findAll({
      attributes: ['user1_id', 'user2_id'],
      include: [
        {
          model: User,
          as: 'User1',
          where: { is_uploaded: false },
          attributes: [],
        },
        {
          model: User,
          as: 'User2',
          where: { is_uploaded: false },
          attributes: [],
          required: false, // optional if user2 is nullable
        },
      ],
    });

    const allTimeCompetitorIds = new Set();
    allTimeCompetitorsRaw.forEach(({ user1_id, user2_id }) => {
      if (user1_id) allTimeCompetitorIds.add(user1_id);
      if (user2_id) allTimeCompetitorIds.add(user2_id);
    });

    const allTimeCompetitors = allTimeCompetitorIds.size;
    const allTimeRatio =
      allTimeCompetitors > 0
        ? (allTimeVoters / allTimeCompetitors).toFixed(2)
        : '0.00';

    // CURRENT snapshot — only Live or Upcoming contests
    const activeContests = await Contest.findAll({
      where: {
        status: { [Op.in]: ['Live', 'Upcoming'] },
      },
      attributes: ['id'],
    });

    const activeContestIds = activeContests.map((c) => c.id);

    const activeCompetitions = await Competition.findAll({
      where: {
        contest_id: { [Op.in]: activeContestIds },
      },
      attributes: ['user1_id', 'user2_id'],
      include: [
        {
          model: User,
          as: 'User1',
          where: { is_uploaded: false },
          attributes: [],
        },
        {
          model: User,
          as: 'User2',
          where: { is_uploaded: false },
          attributes: [],
          required: false, // optional if user2 is nullable
        },
      ],
    });

    const currentCompetitorIds = new Set();
    activeCompetitions.forEach(({ user1_id, user2_id }) => {
      if (user1_id) currentCompetitorIds.add(user1_id);
      if (user2_id) currentCompetitorIds.add(user2_id);
    });

    const currentCompetitors = currentCompetitorIds.size;

    const now = new Date();
    const currentVoters = await Vote.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        }, // last 7 days
      },
      include: [
        {
          model: User,
          where: {
            is_uploaded: false,
          },
          attributes: [],
        },
      ],
      distinct: true,
      col: 'voter_id',
    });

    const currentRatio =
      currentCompetitors > 0
        ? (currentVoters / currentCompetitors).toFixed(2)
        : '0.00';

    res.json({
      current: {
        voters: currentVoters,
        competitors: currentCompetitors,
        ratio: currentRatio,
      },
      all_time: {
        voters: allTimeVoters,
        competitors: allTimeCompetitors,
        ratio: allTimeRatio,
      },
    });
  } catch (err) {
    console.error('❌ Error in getVoterToCompetitorRatio:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getRetentionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day

    const intervals = [1, 7, 30];
    const results = {};

    for (const days of intervals) {
      const signupStart = new Date(today);
      signupStart.setDate(signupStart.getDate() - days);

      // 🎯 Get users who signed up in the last N days (excluding today)
      const cohortUsers = await User.findAll({
        where: {
          role: 'participant',
          suspended: false,
          is_uploaded: false,
          createdAt: {
            [Op.gte]: signupStart,
            [Op.lt]: today, // exclude today
          },
        },
        attributes: ['id'],
      });

      const userIds = cohortUsers.map((u) => u.id);

      if (userIds.length === 0) {
        results[`${days}_day`] = {
          cohortSize: 0,
          retained: 0,
          percentage: '0.00',
        };
        continue;
      }

      // ✅ Check if they EVER voted or competed since signup
      const activeVotes = await Vote.findAll({
        where: {
          voter_id: { [Op.in]: userIds },
          createdAt: { [Op.gte]: signupStart }, // since signup
        },
        include: [
          {
            model: User,
            where: {
              is_uploaded: false,
            },
            attributes: [],
          },
        ],
        attributes: ['voter_id'],
        group: ['voter_id'],
      });

      const activeCompetitions = await Competition.findAll({
        where: {
          [Op.or]: [
            { user1_id: { [Op.in]: userIds } },
            { user2_id: { [Op.in]: userIds } },
          ],
          createdAt: { [Op.gte]: signupStart }, // since signup
        },
        include: [
          {
            model: User,
            as: 'User1',
            where: { is_uploaded: false },
            attributes: [],
          },
          {
            model: User,
            as: 'User2',
            where: { is_uploaded: false },
            attributes: [],
            required: false, // optional if user2 is nullable
          },
        ],
        attributes: ['user1_id', 'user2_id'],
      });

      const retainedUserIds = new Set();
      activeVotes.forEach((v) => retainedUserIds.add(v.voter_id));
      activeCompetitions.forEach((c) => {
        if (userIds.includes(c.user1_id)) retainedUserIds.add(c.user1_id);
        if (userIds.includes(c.user2_id)) retainedUserIds.add(c.user2_id);
      });

      const retainedCount = retainedUserIds.size;
      const percentage = ((retainedCount / userIds.length) * 100).toFixed(2);

      results[`${days}_day`] = {
        cohortSize: userIds.length,
        retained: retainedCount,
        percentage,
      };
    }

    res.json(results);
  } catch (err) {
    console.error('❌ Error in getRetentionStats:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getGlobalRetentionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const intervals = [1, 7, 30];
    const results = {};

    // Get all user IDs
    const allUsers = await User.findAll({
      where: {
        role: 'participant',
        suspended: false,
        is_uploaded: false,
      },
      attributes: ['id'],
    });

    const userIds = allUsers.map((u) => u.id);

    if (userIds.length === 0) {
      intervals.forEach((days) => {
        results[`${days}_day`] = {
          totalUsers: 0,
          active: 0,
          percentage: '0.00',
        };
      });
      return res.json(results);
    }

    for (const days of intervals) {
      const activityStart = new Date(today);
      activityStart.setDate(activityStart.getDate() - days);
      const activityEnd = new Date(today);
      activityEnd.setDate(activityEnd.getDate() + 1);

      const activeVotes = await Vote.findAll({
        where: {
          voter_id: { [Op.in]: userIds },
          createdAt: {
            [Op.gte]: activityStart,
            [Op.lt]: activityEnd,
          },
        },
        include: [
          {
            model: User,
            where: {
              is_uploaded: false,
            },
            attributes: [],
          },
        ],
        attributes: ['voter_id'],
        group: ['voter_id'],
      });

      const activeCompetitions = await Competition.findAll({
        where: {
          createdAt: {
            [Op.gte]: activityStart,
            [Op.lt]: activityEnd,
          },
          [Op.or]: [
            { user1_id: { [Op.in]: userIds } },
            { user2_id: { [Op.in]: userIds } },
          ],
        },
        include: [
          {
            model: User,
            as: 'User1',
            where: { is_uploaded: false },
            attributes: [],
          },
          {
            model: User,
            as: 'User2',
            where: { is_uploaded: false },
            attributes: [],
            required: false, // optional if user2 is nullable
          },
        ],
        attributes: ['user1_id', 'user2_id'],
      });

      const activeContests = await Contest.findAll({
        where: {
          creator_id: { [Op.in]: userIds },
          createdAt: {
            [Op.gte]: activityStart,
            [Op.lt]: activityEnd,
          },
        },
        attributes: ['creator_id'],
      });

      const retainedUserIds = new Set();
      activeVotes.forEach((v) => retainedUserIds.add(v.voter_id));
      activeCompetitions.forEach((c) => {
        if (userIds.includes(c.user1_id)) retainedUserIds.add(c.user1_id);
        if (userIds.includes(c.user2_id)) retainedUserIds.add(c.user2_id);
      });
      activeContests.forEach((c) => retainedUserIds.add(c.creator_id));

      const retainedCount = retainedUserIds.size;
      const percentage = ((retainedCount / userIds.length) * 100).toFixed(2);

      results[`${days}_day`] = {
        totalUsers: userIds.length,
        active: retainedCount,
        percentage,
      };
    }

    res.json(results);
  } catch (err) {
    console.error('❌ Error in getGlobalRetentionStats:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

exports.getNewAndRepeatVotersPerWeek = async (req, res) => {
  try {
    const today = moment();

    // Get the previous week's Monday 00:00:00
    const lastWeekStart = today
      .clone()
      .startOf('isoWeek')
      .subtract(1, 'week')
      .startOf('day')
      .toDate();

    // ✅ Check if already recorded
    const existing = await WeeklyVoterStats.findOne({
      where: { weekStart: lastWeekStart.toISOString().slice(0, 10) },
    });

    if (!existing) {
      await recordWeeklyVoterStats();
    }

    // 📦 Return all weekly saved records
    const allStats = await WeeklyVoterStats.findAll({
      order: [['weekStart', 'DESC']],
      limit: 8,
    });

    res.json(allStats);
  } catch (err) {
    console.error('❌ Error in getNewAndRepeatVotersPerWeek:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description get the new and repeat competitor per week from the DB storage
 * @routes (GET /competitor/new-vs-repeat)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.getNewAndRepeatCompetitorPerWeek = async (req, res) => {
  try {
    const today = moment();

    // Get the previous week's Monday 00:00:00
    const lastWeekStart = today
      .clone()
      .startOf('isoWeek')
      .subtract(1, 'week')
      .startOf('day')
      .toDate();

    // ✅ Check if already recorded

    const existing = await WeeklyCompetitorStats.findOne({
      where: { weekStart: lastWeekStart.toISOString().slice(0, 10) },
    });

    if (!existing) {
      await recordWeeklyCompetitorStats();
    }

    // 📦 Return all weekly saved records
    const allStats = await WeeklyCompetitorStats.findAll({
      order: [['weekStart', 'DESC']],
      limit: 8,
    });

    res.json(allStats);
  } catch (err) {
    console.error('❌ Error in getNewAndRepeatCompetitorPerWeek:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description get the report count rate per week
 * @routes (GET /report/report-rate)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.getReportCountRatePerWeek = async (req, res) => {
  try {
    const today = moment();

    // Get the previous week's Monday 00:00:00
    const lastWeekStart = today
      .clone()
      .startOf('isoWeek')
      .subtract(1, 'week')
      .startOf('day')
      .toDate();

    // ✅ Check if already recorded

    const existing = await WeeklyReportStats.findOne({
      where: { weekStart: lastWeekStart.toISOString().slice(0, 10) },
    });

    if (!existing) {
      await recordWeeklyReportStats();
    }

    // 📦 Return all weekly saved records
    const allStats = await WeeklyReportStats.findAll({
      order: [['weekStart', 'DESC']],
      limit: 8,
    });

    res.json(allStats);
  } catch (err) {
    console.error('❌ Error in getReportCountRatePerWeek:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};
