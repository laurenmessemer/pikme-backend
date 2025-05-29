const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');

router.get(
  '/votes/average',
  isAdminMiddleware,
  metricsController.getAvgVotesPerUser
);
router.get(
  '/votes/voting-user-percentage',
  isAdminMiddleware,
  metricsController.getVotingUserPercentage
);
router.get(
  '/votes/current-competing-users',
  isAdminMiddleware,
  metricsController.getCurrentCompetingUsers
);
router.get(
  '/votes/voting-and-competing-stats',
  isAdminMiddleware,
  metricsController.getVotingAndCompetingStats
);
router.get(
  '/votes/voter-to-competitor-ratio',
  isAdminMiddleware,
  metricsController.getVoterToCompetitorRatio
);
router.get(
  '/votes/retention',
  isAdminMiddleware,
  metricsController.getRetentionStats
);
router.get(
  '/votes/global-retention',
  isAdminMiddleware,
  metricsController.getGlobalRetentionStats
);
router.get(
  '/votes/new-vs-repeat',
  isAdminMiddleware,
  metricsController.getNewAndRepeatVotersPerWeek
);
router.get(
  '/votes/:userId',
  isAdminMiddleware,
  metricsController.getVoteMetrics
);

module.exports = router;
