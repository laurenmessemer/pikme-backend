const { Competition, Contest, Theme } = require("../models");
const { Op, Sequelize } = require("sequelize");

// ✅ Fetch active competitions where both images exist
exports.getVotingEntries = async (req, res) => {
  try {
    const competitions = await Competition.findAll({
      where: {
        status: "Active",
        user1_image: { [Op.not]: null },
        user2_image: { [Op.not]: null },
      },
      include: [
        {
          model: Contest,
          where: { status: "Live" },
          include: [{ model: Theme, as: "Theme" }]
        }
      ],
      order: [Sequelize.literal("RANDOM()")],
      limit: 5
    });

    console.log("✅ Fetched voting competitions:", competitions);

    if (!competitions || competitions.length === 0) {
      return res.status(200).json({ competitions: [], message: "No more competitions left to vote on." });
    }

    const formatted = competitions.map(comp => ({
      id: comp.id,
      user1_image: comp.user1_image,
      user2_image: comp.user2_image,
      votes_user1: comp.votes_user1, // ✅ add this
      votes_user2: comp.votes_user2, // ✅ add this
      contestId: comp.Contest.id,
      entry_fee: comp.Contest.entry_fee,
      prize_pool: parseFloat(comp.Contest.prize_pool),
      theme_name: comp.Contest.Theme?.name || "Theme",
      theme_description: comp.Contest.Theme?.description || "",
      cover_image: comp.Contest.Theme?.cover_image_url || "",
    }));
    

    res.status(200).json({ competitions: formatted });
  } catch (error) {
    console.error("❌ Error fetching competitions:", error);
    res.status(500).json({ message: "Error fetching competitions", error: error.message });
  }
};

// ✅ Cast vote
exports.castVote = async (req, res) => {
    const { competitionId, selectedImage } = req.body;

    if (!competitionId || !selectedImage) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // ✅ Find the competition
        const competition = await Competition.findByPk(competitionId);

        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        // ✅ Determine which image was voted on
        if (selectedImage === competition.user1_image) {
            competition.votes_user1 += 1;
        } else if (selectedImage === competition.user2_image) {
            competition.votes_user2 += 1;
        } else {
            return res.status(400).json({ message: "Invalid image selected" });
        }

        // ✅ Save the updated vote counts
        await competition.save();

        console.log(`✅ Vote recorded for Competition ${competitionId}:`, {
            votes_user1: competition.votes_user1,
            votes_user2: competition.votes_user2,
        });

        res.status(200).json({ 
            message: "Vote recorded successfully", 
            votes_user1: competition.votes_user1, 
            votes_user2: competition.votes_user2 
        });

    } catch (error) {
        console.error("❌ Error casting vote:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};