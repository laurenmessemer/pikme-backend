const express = require('express');
const { castVote, getVotingEntries } = require('../controllers/voteController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

const router = express.Router();

router.get('/get-entries', getVotingEntries);
router.post('/vote', castVote); // ✅ Ensure this route exists

module.exports = router;
