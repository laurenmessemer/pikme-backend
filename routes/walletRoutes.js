const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const isUserMiddleware = require('../middleware/isUserMiddleware');
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');

// ✅ Route to Get Wallet Balance (No Authentication)
router.get('/', isAdminOrUserMiddleware, walletController.getWallet); // ❌ No `authenticateUser`

module.exports = router;
