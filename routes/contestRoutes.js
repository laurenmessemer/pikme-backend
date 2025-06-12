const express = require('express');
const {
  getAllContests,
  createContest,
  getLiveContests,
  getContestById,
  getLiveAndUpcomingContests,
  updateContest,
  deleteContest,
  downlaodContestTemplate,
  uploadFakeParticipants,
} = require('../controllers/contestController'); // ✅ Ensure correct import
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');

const router = express.Router();

// ✅ Fetch all contests
router.get('/', isAdminOrUserMiddleware, getAllContests);

// Download the sample template of the contest
router.get(
  '/downlaod-contest-template',
  isAdminMiddleware,
  downlaodContestTemplate
);

// upload contest dummy participents in the contest
router.post(
  '/upload-fake-participents',
  isAdminMiddleware,
  uploadFakeParticipants
);

// ✅ Fetch only live contests
router.get('/live', getLiveContests);

// ✅ Fetch only live and upcoming contests
router.get('/live-upcoming', getLiveAndUpcomingContests);

// ✅ Fetch single contest
router.get('/:id', getContestById);

// ✅ Create a new contest
router.post('/', isAdminOrUserMiddleware, createContest);

// ✅ Update contest by ID
router.put('/:id', isAdminOrUserMiddleware, updateContest);

// ✅ Delete contest by ID
router.delete('/:id', isAdminOrUserMiddleware, deleteContest);

module.exports = router;
