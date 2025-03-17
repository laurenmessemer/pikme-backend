const express = require("express");
const router = express.Router();
const CompetitionEntryController = require("../controllers/competitionEntryController");

console.log("✅ CompetitionEntryController:", CompetitionEntryController); // <-- Add this for debugging

const multer = require("multer");
const multerS3 = require("multer-s3");
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


// ✅ NEW ROUTE: Get Pre-Signed URL for Direct Upload
router.get("/get-upload-url", CompetitionEntryController.getUploadURL);

router.post("/update-image", CompetitionEntryController.updateImage);

// ✅ Upload Image & Track Match Type (Legacy Upload - Not used in StepTwo)
router.post("/upload-image", upload.single("image"), CompetitionEntryController.uploadImage);

// ✅ Confirm Payment
router.post("/confirm-payment", CompetitionEntryController.confirmPayment);

// ✅ Convert Pending Entry → Official Competition
router.post("/enter", CompetitionEntryController.enterCompetition);

// ✅ Get Competition Status
router.get("/status", CompetitionEntryController.getCompetitionStatus);

// ✅ Confirm Submission (Marks Competition as Complete)
router.post("/confirm", CompetitionEntryController.confirmSubmission);

console.log("✅ Competition Entry Routes Initialized.");

module.exports = router;
