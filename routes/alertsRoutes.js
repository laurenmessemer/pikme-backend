const express = require('express');
const {
  listAllAlerts,
  readAlert,
  deleteAlert,
} = require('../controllers/alertController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

const router = express.Router();

// List all routes
router.get('/', isUserMiddleware, listAllAlerts);

// read alert
router.put('/:alert_id', isUserMiddleware, readAlert);

// delete alert
router.delete('/:alert_id', isUserMiddleware, deleteAlert);

module.exports = router;
