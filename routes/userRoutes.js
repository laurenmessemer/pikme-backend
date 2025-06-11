const express = require('express');
const {
  getUsers,
  updateUser,
  deleteUser,
  suspendUser,
  verifyAge,
  closeWarnPopUp,
  downloadTemplate,
  uploadUsers,
} = require('../controllers/userController');
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');
const isUserMiddleware = require('../middleware/isUserMiddleware');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');
const handleFileMulter = require('../middleware/handleFileMulter');

const router = express.Router();

// ✅ Fetch all users
router.get('/', isAdminOrUserMiddleware, getUsers);

router.get('/download-csv', isAdminMiddleware, downloadTemplate);

router.post(
  '/upload-userlist',
  isAdminMiddleware,
  handleFileMulter,
  uploadUsers
);

// ✅ Update user details
router.put('/:id', isAdminOrUserMiddleware, updateUser); // 🔥 FIXED: No need for `/users/:id` here

// ✅ Suspend user
router.patch('/:id/suspend', isAdminOrUserMiddleware, suspendUser);

// ✅ Delete user
router.delete('/:id', isAdminOrUserMiddleware, deleteUser);

// ✅ Fetch all users
router.post('/verify-age', isAdminOrUserMiddleware, verifyAge);

// ✅ Close the warn Popup
router.post('/close-warn-popup', isUserMiddleware, closeWarnPopUp);

module.exports = router;
