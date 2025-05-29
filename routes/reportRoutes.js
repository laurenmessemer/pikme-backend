// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

router.post('/submit', isUserMiddleware, reportController.submitReport);

module.exports = router;
