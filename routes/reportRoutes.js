// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.post("/submit", reportController.submitReport);

module.exports = router;
