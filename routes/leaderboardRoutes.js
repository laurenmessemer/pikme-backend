const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController"); // ✅ Correct import

// ✅ Route to get live contests
router.get("/live-contests", leaderboardController.getLiveContests);

// ✅ Route to get all past winners
router.get("/winners", leaderboardController.getWinners);

// ✅ Route to get user submissions
router.get("/mysubmissions", leaderboardController.getUserSubmissions);

// ✅ Get opponent info for a specific competition
router.get("/opponent", leaderboardController.getOpponentInfo);


module.exports = router;
