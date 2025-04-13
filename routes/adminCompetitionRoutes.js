const express = require("express");
const router = express.Router();
const adminCompetitionsController = require("../controllers/adminCompetitionsController");

// ✅ Fetch all competitions with contest + theme + users
router.get("/", adminCompetitionsController.getAllCompetitions);

// ✅ Determine winners manually
router.post("/determine-winners", adminCompetitionsController.determineWinners);

module.exports = router;
