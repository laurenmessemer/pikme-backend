const { Contest, User, Theme } = require("../models"); // ✅ Ensure Theme is imported


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
    const { id } = req.params;
    const contest = await Contest.findByPk(id, {
      include: [
        { 
          model: User, 
          attributes: ["username", "email"] 
        },
        { 
          model: Theme, 
          as: "Theme", // ✅ Ensure this alias matches the model association
          attributes: ["name", "description", "cover_image_url"] 
        }
      ],
    });

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    res.json(contest);
  } catch (error) {
    console.error("❌ Error fetching contest:", error);
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
    const { creator_id, theme_id, status, entry_fee, prize_pool, submission_deadline, voting_live_date, voting_deadline } = req.body;
    
    console.log('Creating contest with data:', req.body); // Log the incoming data

    const newContest = await Contest.create({
      creator_id,
      theme_id,
      status: 'Live', // Set the default status value here
      entry_fee,
      prize_pool,
      submission_deadline,
      voting_live_date,
      voting_deadline,
    });

    res.status(201).json(newContest);
  } catch (error) {
    console.error("❌ Error creating contest:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ✅ Export functions correctly
module.exports = {
  getAllContests,
  getContestById,
  getLiveContests,
  createContest,
};
