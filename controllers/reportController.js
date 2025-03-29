// controllers/reportController.js
const { Report, Competition, User } = require("../models");

exports.submitReport = async (req, res) => {
  const { reporterId, competitionId, imageUrl, categories, description } = req.body;

  if (!reporterId || !competitionId || !imageUrl || !categories?.length) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const competition = await Competition.findByPk(competitionId);
    if (!competition) return res.status(404).json({ message: "Competition not found" });

    let reportedUserId = null;
    if (imageUrl === competition.user1_image) {
      reportedUserId = competition.user1_id;
    } else if (imageUrl === competition.user2_image) {
      reportedUserId = competition.user2_id;
    } else {
      return res.status(400).json({ message: "Image not part of this competition" });
    }

    const report = await Report.create({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      competition_id: competitionId,
      image_url: imageUrl,
      categories,
      description,
    });

    // ✅ Optional: flag image in the competition
    if (imageUrl === competition.user1_image) {
      competition.user1_flagged = true;
    } else {
      competition.user2_flagged = true;
    }
    await competition.save();

    res.status(201).json({ message: "Report submitted", report });
  } catch (err) {
    console.error("❌ Error submitting report:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
