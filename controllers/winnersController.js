const { Competition, User, Contest, Theme } = require("../models");

// ✅ Determine winners
const determineWinners = async (req, res) => {
  try {
    console.log("🔍 Manually determining winners...");

    const now = new Date();
    const competitions = await Competition.findAll({
      include: [
        { model: Contest, attributes: ["entry_fee", "voting_deadline"] },
        { model: User, as: "User1", attributes: ["id", "username"] },
        { model: User, as: "User2", attributes: ["id", "username"] },
      ],
      where: {
        status: "Active",
      },
    });

    let winnersUpdated = 0;

    for (const competition of competitions) {
      if (new Date(competition.Contest.voting_deadline) <= now) {
        let winnerUsername = null;
        let winnerEarnings = 0;

        if (competition.votes_user1 > competition.votes_user2) {
          winnerUsername = competition.User1.username;
          winnerEarnings = competition.Contest.entry_fee * 2;
        } else if (competition.votes_user2 > competition.votes_user1) {
          winnerUsername = competition.User2.username;
          winnerEarnings = competition.Contest.entry_fee * 2;
        }

        if (winnerUsername) {
          await competition.update({
            winner_username: winnerUsername,
            winner_earnings: winnerEarnings,
            status: "Complete",
          });

          winnersUpdated++;
          console.log(`🏆 Winner determined: ${winnerUsername}`);
        }
      }
    }

    res.json({ success: true, message: `${winnersUpdated} competitions updated.` });
  } catch (error) {
    console.error("❌ Error determining winners:", error);
    res.status(500).json({ error: "Server error while determining winners." });
  }
};

// ✅ Get winners for frontend
const getWinners = async (req, res) => {
  try {
    const completedCompetitions = await Competition.findAll({
      where: { status: "Complete" },
      include: [
        {
          model: Contest,
          include: [{ model: Theme, as: "Theme" }],
        },
        { model: User, as: "User1", attributes: ["username"] },
        { model: User, as: "User2", attributes: ["username"] },
      ],
    });

    const winners = completedCompetitions.map((comp) => {
      const isUser1Winner = comp.votes_user1 > comp.votes_user2;
      const winner = isUser1Winner ? comp.User1 : comp.User2;
      return {
        image: isUser1Winner ? comp.user1_image : comp.user2_image,
        username: winner?.username || "Unknown",
        contestId: comp.contest_id,
        payout: comp.winner_earnings,
        totalVotes: comp.votes_user1 + comp.votes_user2,
        startDate: comp.Contest?.contest_live_date,
        endDate: comp.Contest?.voting_deadline,
        Theme: comp.Contest?.Theme || {},
      };
    });

    res.json({ success: true, winners });
  } catch (err) {
    console.error("❌ Failed to fetch winners:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ✅ Properly export both
module.exports = {
  determineWinners,
  getWinners,
};
