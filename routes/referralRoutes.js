const express = require('express');
const router = express.Router();
const { sendReferralEmail } = require('../controllers/referralController');
const { authenticate } = require('../middleware/isUserMiddleware');

// router.post("/send-referral", authenticate, sendReferralEmail);

module.exports = router;
