const { Vote, User, Competition, Contest } = require("../models");
const { getDateFilters } = require("../utils/metricsUtils");
const { Op, Sequelize } = require("sequelize");

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
    console.error("Error fetching vote metrics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAvgVotesPerUser = async (req, res) => {
    const dateFilters = getDateFilters();
    const metrics = {};
  
    try {
      for (const [interval, filter] of Object.entries(dateFilters)) {
        // Total votes in interval
        const totalVotes = await Vote.count({ where: { ...filter } });
  
        // Unique users who cast votes in that interval
        const uniqueVoters = await Vote.count({
          where: { ...filter },
          distinct: true,
          col: "voter_id",
        });
  
        metrics[interval] = {
          totalVotes,
          uniqueVoters,
          avgVotesPerUser: uniqueVoters > 0 ? (totalVotes / uniqueVoters).toFixed(2) : "0.00",
        };
      }
  
      res.json(metrics);
    } catch (err) {
      console.error("❌ Error in getAvgVotesPerUser:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.getVotingUserPercentage = async (req, res) => {
const dateFilters = getDateFilters();
const result = {};

try {
    // Total user count (can adjust to exclude suspended users if desired)
    const totalUsers = await User.count({
    where: {
        role: "participant", // or any roles you want to include
        suspended: false
    }
    });

    for (const [interval, filter] of Object.entries(dateFilters)) {
    // Count distinct voters in that interval
    const voters = await Vote.count({
        where: { ...filter },
        distinct: true,
        col: "voter_id"
    });

    const percentage = totalUsers > 0 ? ((voters / totalUsers) * 100).toFixed(2) : "0.00";

    result[interval] = {
        uniqueVoters: voters,
        totalUsers,
        votingUserPercentage: percentage
    };
    }

    res.json(result);
} catch (err) {
    console.error("❌ Error in getVotingUserPercentage:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
}
};

exports.getCurrentCompetingUsers = async (req, res) => {
  try {
    // Get total eligible users
    const totalUsers = await User.count({
      where: {
        role: "participant",
        suspended: false,
      },
    });

    // Get all Live or Upcoming contests
    const activeContests = await Contest.findAll({
      where: {
        status: {
          [Op.in]: ["Live", "Upcoming"],
        },
      },
    });

    const contestIds = activeContests.map((c) => c.id);

    if (contestIds.length === 0) {
      return res.json({
        competingUsers: 0,
        totalUsers,
        percentage: "0.00",
      });
    }

    // Find all competitions tied to those contests
    const competitions = await Competition.findAll({
      where: {
        contest_id: { [Op.in]: contestIds },
      },
    });

    const uniqueUserIds = new Set();
    competitions.forEach((comp) => {
      if (comp.user1_id) uniqueUserIds.add(comp.user1_id);
      if (comp.user2_id) uniqueUserIds.add(comp.user2_id);
    });

    const count = uniqueUserIds.size;
    const percent = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";

    res.json({
      competingUsers: count,
      totalUsers,
      percentage: percent,
    });
  } catch (err) {
    console.error("❌ Error in getCurrentCompetingUsers:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

exports.getVotingAndCompetingStats = async (req, res) => {
    try {
      // 🔹 Total active users
      const totalUsers = await User.findAll({
        where: {
          role: "participant",
          suspended: false,
        },
        attributes: ["id"],
        raw: true,
      });
      const totalUserIds = totalUsers.map((u) => u.id);
  
      // 🔹 Users who have voted
      const votedUsers = await Vote.findAll({
        attributes: ["voter_id"],
        group: ["voter_id"],
        raw: true,
      });
      const votedUserIds = new Set(votedUsers.map((v) => v.voter_id));
  
      // 🔹 Users who have competed (all-time)
      const allCompetitions = await Competition.findAll({
        attributes: ["user1_id", "user2_id"],
        raw: true,
      });
  
      const competedUserIds = new Set();
      allCompetitions.forEach((comp) => {
        if (comp.user1_id) competedUserIds.add(comp.user1_id);
        if (comp.user2_id) competedUserIds.add(comp.user2_id);
      });
  
      // 🔹 Users who are currently competing (Live or Upcoming)
      const activeCompetitions = await Competition.findAll({
        include: {
          model: Contest,
          where: {
            status: { [Op.in]: ["Live", "Upcoming"] },
          },
        },
        attributes: ["user1_id", "user2_id"],
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
          percentage: totalCount > 0 ? ((currentBoth.length / totalCount) * 100).toFixed(2) : "0.00",
        },
        all_time: {
          both: allTimeBoth.length,
          totalUsers: totalCount,
          percentage: totalCount > 0 ? ((allTimeBoth.length / totalCount) * 100).toFixed(2) : "0.00",
        },
      });
    } catch (err) {
      console.error("❌ Error in getVotingAndCompetingStats:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.getVoterToCompetitorRatio = async (req, res) => {
    try {
      const totalUsers = await User.count({
        where: { role: "participant", suspended: false },
      });
  
      // All-time unique voters
      const allTimeVoters = await Vote.aggregate("voter_id", "count", {
        distinct: true,
      });
  
      // All-time unique competitors
      const allTimeCompetitorsRaw = await Competition.findAll({
        attributes: ["user1_id", "user2_id"],
      });
  
      const allTimeCompetitorIds = new Set();
      allTimeCompetitorsRaw.forEach(({ user1_id, user2_id }) => {
        if (user1_id) allTimeCompetitorIds.add(user1_id);
        if (user2_id) allTimeCompetitorIds.add(user2_id);
      });
  
      const allTimeCompetitors = allTimeCompetitorIds.size;
      const allTimeRatio = allTimeCompetitors > 0
        ? (allTimeVoters / allTimeCompetitors).toFixed(2)
        : "0.00";
  
      // CURRENT snapshot — only Live or Upcoming contests
      const activeContests = await Contest.findAll({
        where: {
          status: { [Op.in]: ["Live", "Upcoming"] },
        },
        attributes: ["id"],
      });
  
      const activeContestIds = activeContests.map(c => c.id);
  
      const activeCompetitions = await Competition.findAll({
        where: {
          contest_id: { [Op.in]: activeContestIds },
        },
        attributes: ["user1_id", "user2_id"],
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
          createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
        },
        distinct: true,
        col: "voter_id",
      });
  
      const currentRatio = currentCompetitors > 0
        ? (currentVoters / currentCompetitors).toFixed(2)
        : "0.00";
  
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
      console.error("❌ Error in getVoterToCompetitorRatio:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.getRetentionStats = async (req, res) => {
  try {
    const today = new Date();
    const intervals = [1, 7, 30];
    const results = {};

    for (const days of intervals) {
      const signupStart = new Date(today);
      signupStart.setDate(signupStart.getDate() - days);

      const signupEnd = new Date(signupStart);
      signupEnd.setDate(signupEnd.getDate() + 1); // users who signed up exactly N days ago

      const cohortUsers = await User.findAll({
        where: {
          role: "participant",
          suspended: false,
          createdAt: {
            [Op.gte]: signupStart,
            [Op.lt]: signupEnd,
          },
        },
        attributes: ["id"],
      });

      const userIds = cohortUsers.map((u) => u.id);

      if (userIds.length === 0) {
        results[`${days}_day`] = {
          cohortSize: 0,
          retained: 0,
          percentage: "0.00",
        };
        continue;
      }

      const retentionCutoff = new Date(signupEnd); // next day forward

      const activeVotes = await Vote.findAll({
        where: {
          voter_id: { [Op.in]: userIds },
          createdAt: { [Op.gte]: retentionCutoff },
        },
        attributes: ["voter_id"],
        group: ["voter_id"],
      });

      const activeCompetitions = await Competition.findAll({
        where: {
          [Op.or]: [
            { user1_id: { [Op.in]: userIds } },
            { user2_id: { [Op.in]: userIds } },
          ],
          createdAt: { [Op.gte]: retentionCutoff },
        },
        attributes: ["user1_id", "user2_id"],
      });

      const activeContests = await Contest.findAll({
        where: {
          creator_id: { [Op.in]: userIds },
          createdAt: { [Op.gte]: retentionCutoff },
        },
        attributes: ["creator_id"],
      });

      // Merge and deduplicate retained user IDs
      const retainedUserIds = new Set();

      activeVotes.forEach((v) => retainedUserIds.add(v.voter_id));
      activeCompetitions.forEach((c) => {
        if (userIds.includes(c.user1_id)) retainedUserIds.add(c.user1_id);
        if (userIds.includes(c.user2_id)) retainedUserIds.add(c.user2_id);
      });
      activeContests.forEach((c) => retainedUserIds.add(c.creator_id));

      const retainedCount = retainedUserIds.size;
      const percent = ((retainedCount / userIds.length) * 100).toFixed(2);

      results[`${days}_day`] = {
        cohortSize: userIds.length,
        retained: retainedCount,
        percentage: percent,
      };
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error in getRetentionStats:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
