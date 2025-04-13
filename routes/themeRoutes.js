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
} = require("../controllers/themeController");

// ✅ AWS S3 Pre-signed URL Route
router.get("/get-upload-url", getUploadURL);

// ✅ Theme CRUD Routes
router.post("/create", createTheme);
router.get("/", getAllThemes);
router.get("/:id", getThemeById);
router.put("/:id", updateTheme);
router.delete("/:id", deleteTheme);
router.post("/:id/entries", addThemeEntry);
router.delete("/entries/:id", deleteThemeEntry);

module.exports = router;
