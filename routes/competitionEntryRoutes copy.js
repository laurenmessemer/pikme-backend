const express = require("express");

const {
  enterCompetition,
  uploadEntryImage,
  chooseOpponent,
  useTokenForEntry,
  confirmSubmission,
  getCompetitionStatus, 
  checkOrCreateEntry,
  generateInviteCode,
  findOpenCompetition,
} = require("../controllers/competitionEntryController");

const router = express.Router();

// ✅ Step 1: Enter Competition
router.post("/enter", enterCompetition);

// ✅ Step 2: Upload Image
router.post("/upload-image", uploadEntryImage);

// ✅ Step 3: Choose an Opponent
router.post("/choose-opponent", chooseOpponent);

// ✅ Step 4.1 Automatically check and create entry
router.get("/status", checkOrCreateEntry);

// ✅ Step 4.2 Deduct tokens & confirm entry
router.post("/use-token", useTokenForEntry);

// ✅ Route to generate an invite code
router.post("/generate-invite", generateInviteCode);

// ✅ Step 5: Confirm Submission
router.post("/confirm-submission", confirmSubmission);

// ✅ Step 6: Get Competition Status
router.get("/status", getCompetitionStatus); // ✅ This was missing

// ✅ Find Open Competition
router.get("/find-open", findOpenCompetition);



module.exports = router;


