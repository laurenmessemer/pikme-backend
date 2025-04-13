const { Competition, User, Contest, Theme } = require("../models");

// ✅ Fetch all competitions for admin (with Theme data)
exports.getAllCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          attributes: ["id", "status", "entry_fee", "theme_id"],
          include: [
            {
              model: Theme,
              as: "Theme",
              attributes: ["id", "name", "cover_image_url"],
            },
          ],
        },
        { model: User, as: "User1", attributes: ["id", "username"] },
        { model: User, as: "User2", attributes: ["id", "username"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(competitions);
  } catch (error) {
    console.error("❌ Error fetching competitions:", error);
    res.status(500).json({ error: "Server error while fetching competitions." });
  }
};

// ✅ Determine winners manually
exports.determineWinners = async (req, res) => {
  try {
    const now = new Date();
    const competitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          attributes: ["entry_fee", "voting_deadline"],
        },
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
        }
      }
    }

    res.json({ success: true, message: `${winnersUpdated} competitions updated.` });
  } catch (error) {
    console.error("❌ Error determining winners:", error);
    res.status(500).json({ error: "Server error while determining winners." });
  }
};
