const express = require('express');
const {
  getUsers,
  updateUser,
  deleteUser,
  suspendUser,
} = require('../controllers/userController');
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');

const router = express.Router();

// ✅ Fetch all users
router.get('/', isAdminOrUserMiddleware, getUsers);

// ✅ Update user details
router.put('/:id', isAdminOrUserMiddleware, updateUser); // 🔥 FIXED: No need for `/users/:id` here

// ✅ Suspend user
router.patch('/:id/suspend', isAdminOrUserMiddleware, suspendUser);

// ✅ Delete user
router.delete('/:id', isAdminOrUserMiddleware, deleteUser);

module.exports = router;
