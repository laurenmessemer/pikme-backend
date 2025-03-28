// routes/winnersRoutes.js
const express = require("express");
const router = express.Router();
const winnersController = require("../controllers/winnersController");

router.post("/determine", winnersController.determineWinners);
router.get("/", winnersController.getWinners);

module.exports = router;
