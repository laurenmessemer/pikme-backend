const express = require("express");
const {
  getAllContests,
  createContest,
  getLiveContests,
  getContestById,
  getLiveAndUpcomingContests,
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

module.exports = router;
