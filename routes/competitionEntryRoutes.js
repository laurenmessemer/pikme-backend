const express = require('express');
const router = express.Router();
const CompetitionEntryController = require('../controllers/competitionEntryController');

const AWS = require('aws-sdk');
const isUserMiddleware = require('../middleware/isUserMiddleware');
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');
require('dotenv').config();

// ✅ Initialize AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ✅ Create AWS S3 instance
const s3 = new AWS.S3();

// ✅ NEW ROUTE: Get Pre-Signed URL for Direct Upload
router.get(
  '/get-upload-url',
  isUserMiddleware,
  CompetitionEntryController.getUploadURL
);
router.post(
  '/delete-image-url',
  isAdminOrUserMiddleware,
  CompetitionEntryController.deleteImageS3URL
);

router.post(
  '/update-image',
  isUserMiddleware,
  CompetitionEntryController.updateImage
);

// ✅ Confirm Payment
router.post(
  '/confirm-payment',
  isUserMiddleware,
  CompetitionEntryController.confirmPayment
);

// ✅ Convert Pending Entry → Official Competition
router.post(
  '/enter',
  isUserMiddleware,
  CompetitionEntryController.enterCompetition
);

// ✅ Get Competition Status
router.get(
  '/status',
  isUserMiddleware,
  CompetitionEntryController.getCompetitionStatus
);

// ✅ Confirm Submission (Marks Competition as Complete)
router.post(
  '/confirm',
  isUserMiddleware,
  CompetitionEntryController.confirmSubmission
);

// ✅ Get Invite for Competition
router.get(
  '/invite/:inviteLink',
  isUserMiddleware,
  CompetitionEntryController.getInviteCompetition
);

// ✅ Get Invite for Competition
router.get(
  '/validate-invite-code/:inviteLink',
  CompetitionEntryController.validateInviteCode
);

// ✅ Accept Invite for Competition
router.post(
  '/accept-invite',
  isUserMiddleware,
  CompetitionEntryController.acceptInvite
);

// ✅ Send Invite Email
router.post(
  '/send-invite',
  isUserMiddleware,
  CompetitionEntryController.emailInviteLink
);

// ✅ Send Invite Email
router.get(
  '/get-competition',
  isUserMiddleware,
  CompetitionEntryController.getCompetitionById
);

module.exports = router;
