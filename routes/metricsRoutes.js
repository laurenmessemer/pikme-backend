const express = require("express");
const router = express.Router();
const { getVoteMetrics, getAvgVotesPerUser, getVotingUserPercentage } = require("../controllers/metricsController");

router.get("/votes/average", getAvgVotesPerUser);
router.get("/votes/:userId", getVoteMetrics);
router.get("/votes/voting-user-percentage", getVotingUserPercentage);

module.exports = router;