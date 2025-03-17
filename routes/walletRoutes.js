const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");

// ✅ Route to Get Wallet Balance (No Authentication)
router.get("/", walletController.getWallet); // ❌ No `authenticateUser`

module.exports = router;
