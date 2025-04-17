const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");

router.get("/votes/average", metricsController.getAvgVotesPerUser);
router.get("/votes/voting-user-percentage", metricsController.getVotingUserPercentage);
router.get("/votes/current-competing-users", metricsController.getCurrentCompetingUsers);
router.get("/votes/voting-and-competing-stats", metricsController.getVotingAndCompetingStats);
router.get("/votes/voter-to-competitor-ratio", metricsController.getVoterToCompetitorRatio);
router.get("/votes/:userId", metricsController.getVoteMetrics);


module.exports = router;
