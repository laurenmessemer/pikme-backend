const { Competition } = require("../models");
const { Op, Sequelize } = require("sequelize");

// ✅ Fetch active competitions where both images exist
exports.getVotingEntries = async (req, res) => {
    try {
        const competitions = await Competition.findAll({
            where: {
                status: "Active", // Only active competitions
                user1_image: { [Op.not]: null },
                user2_image: { [Op.not]: null },
            },
            order: [Sequelize.literal("RANDOM()")], // Shuffle competitions
            attributes: ["id", "user1_image", "user2_image"], // Select only needed fields
            limit: 5, // Load 5 at a time for efficiency
        });

        console.log("✅ Fetched competitions for voting:", competitions);

        if (competitions.length === 0) {
            return res.status(200).json({ competitions: [], message: "No more competitions left to vote on." });
        }

        res.status(200).json({ competitions });
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