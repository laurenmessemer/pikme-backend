const express = require("express");
const router = express.Router();
const { getVoteMetrics, getAvgVotesPerUser } = require("../controllers/metricsController");

router.get("/votes/:userId", getVoteMetrics);
router.get("/votes/average", getAvgVotesPerUser);


module.exports = router;