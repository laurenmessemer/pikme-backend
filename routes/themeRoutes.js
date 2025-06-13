const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const fileUpload = require('express-fileupload');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const {
  getUploadURL,
  createTheme,
  getAllThemes,
  getThemeById,
  updateTheme,
  deleteTheme,
  addThemeEntry,
  deleteThemeEntry,
  updateThemeCoverImageUrl,
  uploadThemeCover,
  directUpload,
} = require('../controllers/themeController');
const isUserMiddleware = require('../middleware/isUserMiddleware');
const isAdminOrUserMiddleware = require('../middleware/isAdminOrUserMiddleware');
const handleFileMulter = require('../middleware/handleFileMulter');

// ✅ Debugging wrapper
router.post(
  '/direct-upload',
  isAdminOrUserMiddleware,
  handleFileMulter,
  directUpload
);

// ✅ Other Routes
router.get('/get-upload-url', isAdminOrUserMiddleware, getUploadURL);
router.post('/create', isAdminOrUserMiddleware, createTheme);
router.get('/', isAdminOrUserMiddleware, getAllThemes);
router.get('/:id', isAdminOrUserMiddleware, getThemeById);
router.put('/:id', isAdminOrUserMiddleware, updateTheme);
router.delete('/:id', isAdminOrUserMiddleware, deleteTheme);
router.post('/:id/entries', isAdminOrUserMiddleware, addThemeEntry);
router.delete('/entries/:id', isAdminOrUserMiddleware, deleteThemeEntry);
router.put('/update-cover', isAdminOrUserMiddleware, updateThemeCoverImageUrl);

module.exports = router;
