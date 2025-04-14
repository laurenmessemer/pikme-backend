const express = require("express");
const { getUsers, updateUser, deleteUser, suspendUser } = require("../controllers/userController");

const router = express.Router();

// ✅ Fetch all users
router.get("/", getUsers);

// ✅ Update user details
router.put("/:id", updateUser); // 🔥 FIXED: No need for `/users/:id` here

// ✅ Suspend user
router.patch("/:id/suspend", suspendUser);

// ✅ Delete user
router.delete("/:id", deleteUser);


module.exports = router;
