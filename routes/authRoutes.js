const express = require("express");
const { loginUser, registerUser, getUserProfile, verifyEmail, resendVerificationEmail } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Register New User
router.post("/register", registerUser);

// ✅ Login User (Works for Admins too!)
router.post("/login", loginUser);

// ✅ Get Logged-in User Profile (Protected)
router.get("/me", authMiddleware, getUserProfile);

// ✅ Verify Email
router.get("/verify-email", authController.verifyEmail);

// ✅ Resend Verification Email
router.post("/resend-verification", resendVerificationEmail); // ✅ Add this line

module.exports = router;
