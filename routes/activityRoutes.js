const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

router.get("/votes", activityController.getTopVoters);
router.get("/referrals", activityController.getTopReferrers);

module.exports = router;
