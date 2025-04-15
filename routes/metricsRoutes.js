const express = require("express");
const router = express.Router();
const { getVoteMetrics, getAvgVotesPerUser } = require("../controllers/metricsController");

router.get("/votes/average", getAvgVotesPerUser);
router.get("/votes/:userId", getVoteMetrics);

module.exports = router;