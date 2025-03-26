const { Contest, User, Theme } = require("../models"); // ✅ Ensure Theme is imported
const { Op } = require("sequelize");

// ✅ Fetch all contests
const getAllContests = async (req, res) => {
  try {
    const contests = await Contest.findAll({
      include: [{ model: User, attributes: ["username", "email"] }],
    });
    res.json(contests);
  } catch (error) {
    console.error("❌ Error fetching contests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Fetch a single contest by ID
const getContestById = async (req, res) => {
  try {
    console.log("📥 Incoming request to getContestById");
    console.log("🧾 req.params:", req.params);

    const { id } = req.params;

    if (!id || isNaN(id)) {
      console.warn("⚠️ Invalid or missing contest ID:", id);
      return res.status(400).json({ error: "Invalid contest ID" });
    }

    const contest = await Contest.findByPk(id, {
      include: [
        { model: User, attributes: ["username", "email"] },
        {
          model: Theme,
          as: "Theme",
          attributes: ["name", "description", "cover_image_url"]
        }
      ],
    });

    if (!contest) {
      console.warn("⚠️ No contest found for ID:", id);
      return res.status(404).json({ error: "Contest not found" });
    }

    console.log("✅ Contest found:", contest.id);
    res.json(contest);

  } catch (error) {
    console.error("❌ Error fetching contest by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLiveAndUpcomingContests = async (req, res) => {
  try {
    const contests = await Contest.findAll({
      where: {
        status: {
          [Op.or]: ["Live", "Upcoming"],
        },
      },
      include: [
        {
          model: Theme,
          as: "Theme",
          attributes: ["name", "description", "cover_image_url"],
        },
      ],
      order: [
        [Sequelize.literal(`CASE 
          WHEN status = 'Live' THEN 0 
          WHEN status = 'Upcoming' THEN 1 
          ELSE 2 END`), 'ASC'],
        ['contest_live_date', 'ASC'], // Optional: add secondary sort
      ],
    });

    console.log("✅ Ordered Live & Upcoming Contests:", JSON.stringify(contests, null, 2));
    res.json(contests);
  } catch (error) {
    console.error("❌ Error fetching live & upcoming contests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Fetch only live contests
const getLiveContests = async (req, res) => {
  try {
    const liveContests = await Contest.findAll({
      where: { status: "Live" },
      include: [
        {
          model: Theme,
          as: "Theme", // ✅ Ensure this matches the alias in Contest.associate()
          attributes: ["name", "description", "cover_image_url"], // ✅ Fetch only required fields
        },
      ],
    });

    console.log("✅ Live Contests:", JSON.stringify(liveContests, null, 2));
    res.json(liveContests);
  } catch (error) {
    console.error("❌ Error fetching live contests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Create a new contest
const createContest = async (req, res) => {
  try {
    const {
      creator_id,
      theme_id,
      status,
      entry_fee,
      prize_pool,
      submission_deadline,
      voting_live_date,
      voting_deadline,
      winnings,
      total_entries,
      contest_live_date,
    } = req.body;
    
    console.log('Creating contest with data:', req.body); // Log the incoming data

    const newContest = await Contest.create({
      creator_id,
      theme_id,
      status: status || 'Live', // Default to 'Live' if not provided
      entry_fee,
      prize_pool,
      submission_deadline,
      voting_live_date,
      voting_deadline,
      winnings,
      total_entries,
      contest_live_date,
    });

    res.status(201).json(newContest);
  } catch (error) {
    console.error("❌ Error creating contest:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// ✅ Export functions correctly
module.exports = {
  getAllContests,
  getContestById,
  getLiveContests,
  getLiveAndUpcomingContests,
  createContest,
};
