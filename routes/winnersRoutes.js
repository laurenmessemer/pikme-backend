const express = require("express");
const router = express.Router();
const winnersController = require("../controllers/winnersController");

// ✅ Route to Determine Winners for Completed Competitions
router.post("/determine", winnersController.determineWinners);

module.exports = router;
