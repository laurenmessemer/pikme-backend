// routes/winnersRoutes.js
const express = require('express');
const router = express.Router();
const winnersController = require('../controllers/winnersController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

router.post('/determine', isUserMiddleware, winnersController.determineWinners);
router.get('/', isUserMiddleware, winnersController.getWinnersV2);

module.exports = router;
