const express = require("express");
const router = express.Router();
const { getVoteMetrics, getAvgVotesPerUser, getVotingUserPercentage, getCompetingUserPercentage } = require("../controllers/metricsController");

router.get("/votes/average", getAvgVotesPerUser);
router.get("/votes/voting-user-percentage", getVotingUserPercentage);
router.get("/votes/competing-user-percentage", getCompetingUserPercentage);
router.get("/votes/:userId", getVoteMetrics);


module.exports = router;