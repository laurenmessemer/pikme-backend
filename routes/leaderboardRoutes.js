const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController'); // ✅ Correct import
const isUserMiddleware = require('../middleware/isUserMiddleware');

// ✅ Route to get live contests
router.get(
  '/live-contests',
  isUserMiddleware,
  leaderboardController.getLiveContests
);

// ✅ Route to get all past winners
router.get('/winners', isUserMiddleware, leaderboardController.getWinners);

// ✅ Route to get user submissions
router.get(
  '/mysubmissions',
  isUserMiddleware,
  leaderboardController.getUserSubmissions
);

// ✅ Get opponent info for a specific competition
router.get(
  '/opponent',
  isUserMiddleware,
  leaderboardController.getOpponentInfo
);

// ✅ re invite opponent for a specific competition
router.post(
  '/reinvite-opponent',
  isUserMiddleware,
  leaderboardController.reinviteOpponent
);

module.exports = router;
