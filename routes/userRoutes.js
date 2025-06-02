const express = require('express');
const {
  getUsers,
  updateUser,
  deleteUser,
  suspendUser,
  verifyAge,
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

// ✅ Fetch all users
router.post('/verify-age', isAdminOrUserMiddleware, verifyAge);

module.exports = router;
