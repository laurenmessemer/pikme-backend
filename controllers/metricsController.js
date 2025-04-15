const { Vote, User, Competition } = require("../models");
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

exports.getCompetingUserPercentage = async (req, res) => {
    try {
      // ✅ Total users (excluding suspended accounts)
      const totalUsers = await User.count({
        where: {
          role: "participant",
          suspended: false
        }
      });
  
      // ✅ Get unique user IDs from active competitions (user1 and user2)
      const user1s = await Competition.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("user1_id")), "user_id"]],
        where: { status: { [Op.not]: "Complete" }, user1_id: { [Op.ne]: null } },
        raw: true
      });
  
      const user2s = await Competition.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("user2_id")), "user_id"]],
        where: { status: { [Op.not]: "Complete" }, user2_id: { [Op.ne]: null } },
        raw: true
      });
  
      // ✅ Merge and dedupe user IDs
      const uniqueUserIds = new Set([
        ...user1s.map(u => u.user_id),
        ...user2s.map(u => u.user_id)
      ]);
  
      const numCompeting = uniqueUserIds.size;
      const percentage = totalUsers > 0 ? ((numCompeting / totalUsers) * 100).toFixed(2) : "0.00";
  
      res.json({
        totalUsers,
        competingUsers: numCompeting,
        percentage
      });
  
    } catch (err) {
      console.error("❌ Error in getCompetingUserPercentage:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};