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

exports.getIntervalBasedCompetingUsers = async (req, res) => {
    const { User, Competition, Contest } = require("../models");
    const { getDateFilters } = require("../utils/metricsUtils");
    const { Op } = require("sequelize");
  
    const dateFilters = getDateFilters();
    const results = {};
  
    try {
      const totalUsers = await User.count({
        where: { role: "participant", suspended: false },
      });
  
      for (const [interval, filter] of Object.entries(dateFilters)) {
        const start = filter.createdAt[Op.gte];
        const end = filter.createdAt[Op.lte];
  
        const competitions = await Competition.findAll({
          include: {
            model: Contest,
            where: {
              status: {
                [Op.in]: ["Live", "Upcoming"],
              },
              // Contest is considered "active" in the interval if its date range overlaps the interval
              [Op.or]: [
                {
                  contest_live_date: {
                    [Op.between]: [start, end],
                  },
                },
                {
                  voting_deadline: {
                    [Op.between]: [start, end],
                  },
                },
                {
                  contest_live_date: { [Op.lte]: end },
                  voting_deadline: { [Op.gte]: start },
                },
              ],
            },
          },
        });
  
        const uniqueUserIds = new Set();
        competitions.forEach((comp) => {
          if (comp.user1_id) uniqueUserIds.add(comp.user1_id);
          if (comp.user2_id) uniqueUserIds.add(comp.user2_id);
        });
  
        const count = uniqueUserIds.size;
        const percent = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";
  
        results[interval] = {
          competingUsers: count,
          totalUsers,
          percentage: percent,
        };
      }
  
      res.json(results);
    } catch (err) {
      console.error("❌ Error in getIntervalBasedCompetingUsers:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
  };
  


//     const dateFilters = getDateFilters();
//     const results = {};
  
//     try {
//       const totalUsers = await User.count({
//         where: { role: "participant", suspended: false },
//       });
  
//       for (const [interval, filter] of Object.entries(dateFilters)) {
//         // Pull competitions created within the time interval
//         const competitions = await Competition.findAll({
//           where: {
//             ...filter, // Apply to Competition.createdAt
//           },
//           include: {
//             model: Contest,
//             where: {
//               status: { [Op.in]: ["Live", "Upcoming", "Complete"] },
//             },
//           },
//         });
  
//         const competingUserIds = new Set();
//         competitions.forEach((comp) => {
//           if (comp.user1_id) competingUserIds.add(comp.user1_id);
//           if (comp.user2_id) competingUserIds.add(comp.user2_id);
//         });
  
//         const count = competingUserIds.size;
//         const percent = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";
  
//         results[interval] = {
//           competingUsers: count,
//           totalUsers,
//           percentage: percent,
//         };
//       }
  
//       res.json(results);
//     } catch (err) {
//       console.error("❌ Error in getCompetingUserPercentage:", err);
//       res.status(500).json({ message: "Internal Server Error", error: err.message });
//     }
// };

// exports.getCurrentlyActiveCompetingUsers = async (req, res) => {
//     try {
//       const totalUsers = await User.count({
//         where: {
//           role: "participant",
//           suspended: false,
//         },
//       });
  
//       const activeCompetitions = await Competition.findAll({
//         include: {
//           model: Contest,
//           where: {
//             status: {
//               [Op.in]: ["Live", "Upcoming"],
//             },
//           },
//         },
//       });
  
//       const uniqueUserIds = new Set();
//       activeCompetitions.forEach((comp) => {
//         if (comp.user1_id) uniqueUserIds.add(comp.user1_id);
//         if (comp.user2_id) uniqueUserIds.add(comp.user2_id);
//       });
  
//       const count = uniqueUserIds.size;
//       const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";
  
//       res.json({
//         activeCompetingUsers: count,
//         totalUsers,
//         percentage,
//       });
//     } catch (err) {
//       console.error("❌ Error in getCurrentlyActiveCompetingUsers:", err);
//       res.status(500).json({ message: "Internal Server Error", error: err.message });
//     }
// };