const express = require('express');
const { castVote, getVotingEntries } = require('../controllers/voteController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

const router = express.Router();

router.get('/get-entries', isUserMiddleware, getVotingEntries);
router.post('/vote', isUserMiddleware, castVote); // ✅ Ensure this route exists

module.exports = router;
