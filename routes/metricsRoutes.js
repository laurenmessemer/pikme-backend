const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");

router.get("/votes/average", metricsController.getAvgVotesPerUser);
router.get("/votes/voting-user-percentage", metricsController.getVotingUserPercentage);
router.get("/votes/competing-users-by-interval", metricsController.getIntervalBasedCompetingUsers); // ✅ interval-based competing data
router.get("/votes/:userId", metricsController.getVoteMetrics);

module.exports = router;



// const express = require("express");
// const router = express.Router();
// const { getVoteMetrics, getAvgVotesPerUser, getVotingUserPercentage, getCompetingUserPercentage, getCurrentlyActiveCompetingUsers, getIntervalBasedCompetingUsers } = require("../controllers/metricsController");

// router.get("/votes/average", getAvgVotesPerUser);
// router.get("/votes/voting-user-percentage", getVotingUserPercentage);
// router.get("/votes/competing-user-percentage", getCompetingUserPercentage);
// router.get("/votes/currently-active-competing-users", getCurrentlyActiveCompetingUsers);
// router.get("/votes/competing-users-by-interval", getIntervalBasedCompetingUsers); // ✅
// router.get("/votes/:userId", getVoteMetrics);


// module.exports = router;