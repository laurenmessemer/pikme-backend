const express = require('express');
const {
  getAllContests,
  createContest,
  getLiveContests,
  getContestById,
  getLiveAndUpcomingContests,
  updateContest,
  deleteContest,
} = require('../controllers/contestController'); // ✅ Ensure correct import
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');
const isUserMiddleware = require('../middleware/isUserMiddleware');

const router = express.Router();

// ✅ Fetch all contests
router.get('/', isAdminOrUserMiddleware, getAllContests);

// ✅ Fetch only live contests
router.get('/live', isUserMiddleware, getLiveContests);

// ✅ Fetch only live and upcoming contests
router.get('/live-upcoming', isUserMiddleware, getLiveAndUpcomingContests);

// ✅ Fetch single contest
router.get('/:id', isUserMiddleware, getContestById);

// ✅ Create a new contest
router.post('/', isAdminOrUserMiddleware, createContest);

// ✅ Update contest by ID
router.put('/:id', isAdminOrUserMiddleware, updateContest);

// ✅ Delete contest by ID
router.delete('/:id', isAdminOrUserMiddleware, deleteContest);

module.exports = router;
