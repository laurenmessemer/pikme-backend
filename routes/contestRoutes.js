const express = require("express");
const {
  getAllContests,
  createContest,
  getLiveContests,
  getContestById,
  getLiveAndUpcomingContests,
  updateContest,
} = require("../controllers/contestController"); // ✅ Ensure correct import

const router = express.Router();

// ✅ Fetch all contests
router.get("/", getAllContests);

// ✅ Fetch only live contests
router.get("/live", getLiveContests); 

// ✅ Fetch only live and upcoming contests
router.get("/live-upcoming", getLiveAndUpcomingContests);

// ✅ Fetch single contest
router.get("/:id", getContestById); 

// ✅ Create a new contest
router.post("/", createContest);

// ✅ Update contest by ID
router.put("/:id", updateContest);

module.exports = router;
