const express = require("express");
const router = require("express").Router();
const AWS = require("aws-sdk");
require("dotenv").config();

// ✅ Initialize AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ✅ Create AWS S3 instance
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
  upload,
  directUpload,
} = require("../controllers/themeController");

// ✅ AWS S3 Pre-signed URL Route
router.get("/get-upload-url", getUploadURL);
router.post("/direct-upload", directUpload); // ✅ NEW ROUTE
router.use(fileUpload()); // Enable req.files


// ✅ Theme CRUD Routes
router.post("/create", createTheme);
router.get("/", getAllThemes);
router.get("/:id", getThemeById);
router.put("/:id", updateTheme);
router.delete("/:id", deleteTheme);
router.post("/:id/entries", addThemeEntry);
router.delete("/entries/:id", deleteThemeEntry);
router.put("/update-cover", updateThemeCoverImageUrl);
router.post("/upload-cover", upload.single("image"), uploadThemeCover);

module.exports = router;
