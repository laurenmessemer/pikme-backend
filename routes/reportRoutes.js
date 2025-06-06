// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const isUserMiddleware = require('../middleware/isUserMiddleware');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');

router.post('/submit', isUserMiddleware, reportController.submitReport);
router.get('/get-reports', isAdminMiddleware, reportController.getReports);
router.get(
  '/get-reports/:reportId',
  isAdminMiddleware,
  reportController.getReportsById
);
router.post(
  '/update-report-status',
  isAdminMiddleware,
  reportController.updateReportStatus
);
router.get(
  '/get-reported-users',
  isAdminMiddleware,
  reportController.getReportedUser
);
router.get(
  '/get-reported-images',
  isAdminMiddleware,
  reportController.getReportedImages
);
router.get(
  '/get-reported-user/:userId',
  isAdminMiddleware,
  reportController.getReportedUserById
);
router.post(
  '/action-on-reported-user',
  isAdminMiddleware,
  reportController.actionOnReportedUser
);

module.exports = router;
