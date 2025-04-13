const express = require("express");
const router = require("express").Router();
const AWS = require("aws-sdk");
const fileUpload = require("express-fileupload"); // ✅ Add this line
require("dotenv").config();

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
} = require("../controllers/themeController");

router.use(fileUpload()); // ✅ Must come BEFORE routes using `req.files`

// ✅ Routes
router.get("/get-upload-url", getUploadURL);
router.post("/direct-upload", directUpload);
router.post("/create", createTheme);
router.get("/", getAllThemes);
router.get("/:id", getThemeById);
router.put("/:id", updateTheme);
router.delete("/:id", deleteTheme);
router.post("/:id/entries", addThemeEntry);
router.delete("/entries/:id", deleteThemeEntry);
router.put("/update-cover", updateThemeCoverImageUrl);

module.exports = router;
