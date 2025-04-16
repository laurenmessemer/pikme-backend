const express = require("express");
const router = express.Router();
const { getVoteMetrics, getAvgVotesPerUser, getVotingUserPercentage, getCompetingUserPercentage, getCurrentlyActiveCompetingUsers, getIntervalBasedCompetingUsers } = require("../controllers/metricsController");

router.get("/votes/average", getAvgVotesPerUser);
router.get("/votes/voting-user-percentage", getVotingUserPercentage);
router.get("/votes/competing-user-percentage", getCompetingUserPercentage);
router.get("/votes/currently-active-competing-users", getCurrentlyActiveCompetingUsers);
router.get("/votes/competing-users-by-interval", getIntervalBasedCompetingUsers; // ✅
router.get("/votes/:userId", getVoteMetrics);


module.exports = router;