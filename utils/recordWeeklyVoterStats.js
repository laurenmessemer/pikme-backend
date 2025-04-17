const { Vote, WeeklyVoterStats } = require("../models");
const { Sequelize } = require("sequelize");

exports.recordWeeklyVoterStats = async () => {
  const today = new Date();

  // Get the previous week's Monday (start of week)
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - today.getDay() - 6); // Previous Monday
  lastWeekStart.setHours(0, 0, 0, 0);

  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 7); // Following Monday

  try {
    // Fetch all voters and their first vote times, grouped by voter
    const voters = await Vote.findAll({
      attributes: [
        "voter_id",
        [Sequelize.fn("MIN", Sequelize.col("createdAt")), "first_vote"]
      ],
      group: ["voter_id"],
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

    console.log(`📊 Weekly voter stats recorded: ${newVoterIds.size} new, ${repeatVoterIds.size} repeat.`);
  } catch (err) {
    console.error("❌ Error in recordWeeklyVoterStats:", err);
    throw err;
  }
};
