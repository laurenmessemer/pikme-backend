const express = require("express");
const { getUsers, updateUser } = require("../controllers/userController");

const router = express.Router();

// ✅ Fetch all users
router.get("/", getUsers);

// ✅ Update user details
router.put("/:id", updateUser); // 🔥 FIXED: No need for `/users/:id` here

module.exports = router;
