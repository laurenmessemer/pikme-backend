const express = require("express");
const router = express.Router();

// Import each controller function explicitly
const metricsController = require("../controllers/metricsController");

router.get("/votes/average", metricsController.getAvgVotesPerUser);
router.get("/votes/voting-user-percentage", metricsController.getVotingUserPercentage);
router.get("/votes/competing-user-percentage", metricsController.getCompetingUserPercentage);
router.get("/votes/currently-active-competing-users", metricsController.getCurrentlyActiveCompetingUsers);
router.get("/votes/competing-users-by-interval", metricsController.getIntervalBasedCompetingUsers);
router.get("/votes/:userId", metricsController.getVoteMetrics);

module.exports = router;