exports.getWinners = async (req, res) => {
  try {
    const completedCompetitions = await Competition.findAll({
      where: { status: "Complete" },
      include: [
        {
          model: Contest,
          include: [{ model: Theme, as: "Theme" }], // ✅ This line is crucial
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