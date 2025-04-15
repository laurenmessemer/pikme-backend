const { Vote } = require("../models");
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