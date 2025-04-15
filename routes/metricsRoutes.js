const express = require("express");
const router = express.Router();
const { getVoteMetrics } = require("../controllers/metricsController");

router.get("/votes/:userId", getVoteMetrics);

module.exports = router;