const express = require('express');
const router = express.Router();
const adminCompetitionsController = require('../controllers/adminCompetitionsController');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');

// ✅ Fetch all competitions with contest + theme + users
router.get(
  '/',
  isAdminMiddleware,
  adminCompetitionsController.getAllCompetitions
);

// ✅ Determine winners manually
router.post(
  '/determine-winners',
  isAdminMiddleware,
  adminCompetitionsController.determineWinnersV2
);

// ✅ Update competition by ID
router.put(
  '/:id',
  isAdminMiddleware,
  adminCompetitionsController.updateCompetition
);

// ✅ Delete competition by ID
router.delete(
  '/:id',
  isAdminMiddleware,
  adminCompetitionsController.deleteCompetition
);

module.exports = router;
