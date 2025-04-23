const { Competition, Contest, Wallet, User, Op, PendingCompetition } = require("../models");
const crypto = require("crypto");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

// ✅ Load environment variables from .env file
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// ✅ Fix: Ensure `getUploadURL` is properly defined before exporting
const getUploadURL = async (req, res) => {
  try {
    const { user_id, contest_id, match_type, fileType } = req.query;

    if (!user_id || !contest_id || !match_type) {
      return res.status(400).json({ message: "Missing required parameters." });
    }

    const fileKey = `uploads/${Date.now()}-${user_id}.jpg`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      acl: "public-read",
      Key: fileKey,
      Expires: 300, // 5 minutes
      ContentType: fileType || "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    // ✅ Store entry in database (without confirming payment yet)
    const pendingEntry = await PendingCompetition.create({
      user1_id: user_id,
      contest_id,
      match_type,
      status: "waiting",
      user1_image: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
    });

    res.status(200).json({
      uploadURL,
      fileKey,
      pendingEntryId: pendingEntry.id,
    });

  } catch (error) {
    console.error("❌ Error generating upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL", error: error.message });
  }
};


const updateImage = async (req, res) => {
  try {
    console.log("🛠️ Received request to update image:", req.body);

    const { pendingEntryId, imageUrl } = req.body;

    if (!pendingEntryId || !imageUrl) {
      console.error("❌ Missing required fields:", { pendingEntryId, imageUrl });
      return res.status(400).json({ message: "Missing required fields." });
    }

    const pendingEntry = await PendingCompetition.findByPk(pendingEntryId);

    if (!pendingEntry) {
      console.error("❌ Pending entry not found:", pendingEntryId);
      return res.status(404).json({ message: "Pending entry not found!" });
    }

    console.log("🔍 Existing entry BEFORE update:", pendingEntry.toJSON());

    // ✅ Explicitly update only the user1_image field
    pendingEntry.user1_image = imageUrl;

    await pendingEntry.save({ fields: ["user1_image"] });

    console.log("✅ Entry AFTER update:", pendingEntry.toJSON()); // Verify change

    res.status(200).json({ message: "Image URL updated successfully!" });

  } catch (error) {
    console.error("❌ Error updating image URL:", error);
    res.status(500).json({ message: "Error updating image URL", error: error.message });
  }
};

// ✅ Fix: Ensure all other functions are also defined before exporting
const uploadImage = async (req, res) => {
  try {
    const { user_id, contest_id, match_type } = req.body;
    const imageFile = req.file;

    if (!user_id || !contest_id || !imageFile || !match_type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("✅ File Uploaded to S3:", imageFile);

    const pendingEntry = await PendingCompetition.create({
      user1_id: user_id,
      contest_id,
      match_type,
      status: "waiting",
      user1_image: imageFile.location, // ✅ Store S3 URL
    });

    res.status(201).json({
      message: "Image uploaded successfully!",
      pendingEntryId: pendingEntry.id,
      imageUrl: imageFile.location, // ✅ Send S3 URL to frontend
    });

  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image", error: error.message });
  }
};

// ✅ Fix: Define all functions before exporting them
const confirmPayment = async (req, res) => {
  try {
    console.log("🛠️ Incoming Confirm Payment Request:", req.body);

    const { user_id, contest_id, entry_fee, match_type } = req.body;
    console.log("🧠 Confirm Payment - match_type received:", match_type);


    if (!user_id || !contest_id || entry_fee === undefined || !match_type) {
      console.error("❌ Missing required fields:", { user_id, contest_id, entry_fee, match_type });
      return res.status(400).json({ message: "Missing required fields." });
    }

    const pendingEntry = await PendingCompetition.findOne({
      where: { user1_id: user_id, contest_id, status: "waiting" },
    });

    if (!pendingEntry) {
      console.error("❌ No pending entry found for:", { user_id, contest_id });
      return res.status(404).json({ message: "No pending image found!" });
    }

    const wallet = await Wallet.findOne({ where: { user_id } });

    if (!wallet) {
      console.error("❌ Wallet not found for user:", user_id);
      return res.status(404).json({ message: "Wallet not found!" });
    }

    if (wallet.token_balance < entry_fee) {
      console.error("❌ Insufficient tokens for user:", user_id);
      return res.status(400).json({ message: "Insufficient tokens!" });
    }

    // ✅ Deduct tokens and update wallet
    wallet.token_balance -= entry_fee;
    await wallet.save();
    console.log("✅ Wallet updated! New balance:", wallet.token_balance);

    // ✅ Mark entry as accepted and update match type
    pendingEntry.status = "accepted";
    pendingEntry.match_type = match_type;
    await pendingEntry.save();

    console.log(`✅ Entry accepted for user ${user_id}. Now entering competition...`);

    // 🔥 **Immediately attempt to enter the competition**
    let competition = null;
    let joinedExistingMatch = false;

    if (match_type === "pick_random") {
      competition = await Competition.findOne({
        where: { contest_id, match_type: "pick_random", user2_id: null, status: "Waiting" },
        order: [["createdAt", "ASC"]],
      });

      if (competition) {
        competition.user2_id = user_id;
        competition.user2_image = pendingEntry.user1_image;
        competition.status = "Active";
        await competition.save();
        joinedExistingMatch = true;
        console.log(`✅ User ${user_id} matched into existing competition ${competition.id}`);
      }
    }

    if (!competition) {
      competition = await Competition.create({
        contest_id,
        user1_id: user_id,
        user1_image: pendingEntry.user1_image,
        match_type, // ✅ Pass match_type properly
        status: "Waiting",
      });

      if (match_type === "invite_friend") {
        const inviteCode = crypto.randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
          competition.invite_link = inviteCode;
          await competition.save();
      }

      console.log(`✅ New competition created with ID ${competition.id} for user ${user_id}`);
    }

    // ✅ Remove pending entry since user has entered a competition
    await PendingCompetition.destroy({ where: { id: pendingEntry.id } });

    res.status(200).json({
      message: "Payment confirmed, competition entered!",
      new_balance: wallet.token_balance,
      match_type: pendingEntry.match_type,
      competition,
      inviteLink: competition.invite_link || null,
      joinedExistingMatch,
    });

  } catch (error) {
    console.error("❌ Error confirming payment:", error);
    res.status(500).json({ message: "Error confirming payment.", error: error.message });
  }
};

const enterCompetition = async (req, res) => {
  try {
    const { user_id, contest_id } = req.body;

    if (!user_id || !contest_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const pendingEntry = await PendingCompetition.findOne({
      where: { user1_id: user_id, contest_id, status: "payment_confirmed" },
    });

    if (!pendingEntry) {
      return res.status(404).json({ message: "No confirmed entry found!" });
    }

    const match_type = pendingEntry.match_type;
    let competition = null;
    let joinedExistingMatch = false;

    if (match_type === "pick_random") {
      competition = await Competition.findOne({
        where: { contest_id, match_type: "pick_random", user2_id: null, status: "Waiting" },
        order: [["createdAt", "ASC"]],
      });

      if (competition) {
        competition.user2_id = user_id;
        competition.user2_image = pendingEntry.user1_image;
        competition.status = "Active";
        await competition.save();
        joinedExistingMatch = true;
      }
    }

    if (!competition) {
      competition = await Competition.create({
        contest_id,
        user1_id: user_id,
        user1_image: pendingEntry.user1_image,
        match_type,
        status: "Waiting",
      });

      if (match_type === "invite_friend") {
        competition.invite_link = `https://pikme.com/invite/${competition.id}`;
        await competition.save();
      }
    }

    await PendingCompetition.destroy({ where: { id: pendingEntry.id } });

    res.status(201).json({
      message: "Competition entry confirmed!",
      competition,
      inviteLink: competition.invite_link || null,
      joinedExistingMatch,
    });

  } catch (error) {
    console.error("❌ Error entering competition:", error);
    res.status(500).json({ message: "Error entering competition.", error: error.message });
  }
};

const getCompetitionStatus = async (req, res) => {
  try {
    const { user_id, contest_id } = req.query;

    const competition = await Competition.findOne({
      where: { contest_id, user1_id: user_id },
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found." });
    }

    res.status(200).json({
      status: competition.status,
      invite_link: competition.match_type === "invite_friend" ? competition.invite_link : null,
    });
  } catch (error) {
    console.error("❌ Error fetching competition status:", error);
    res.status(500).json({ error: "Error fetching competition status." });
  }
};

const confirmSubmission = async (req, res) => {
  try {
    const { user_id, contest_id } = req.body;

    const entry = await Competition.findOne({ where: { contest_id, user1_id: user_id } });
    if (!entry) return res.status(404).json({ message: "Entry not found!" });

    entry.status = "Complete";
    await entry.save();

    res.status(200).json({ message: "Entry confirmed!" });
  } catch (error) {
    console.error("❌ Error confirming submission:", error);
    res.status(500).json({ message: "Error confirming submission.", error: error.message });
  }
};


const getInviteCompetition = async (req, res) => {
  const { inviteLink } = req.params;

  try {
    const competition = await Competition.findOne({ where: { invite_link: inviteLink } });

    if (!competition) {
      return res.status(404).json({ message: "Invite link is invalid or expired." });
    }

    if (competition.user2_id) {
      return res.status(400).json({ message: "This competition already has a second participant." });
    }

    res.status(200).json({ competition });
  } catch (error) {
    console.error("❌ Error fetching invite competition:", error);
    res.status(500).json({ message: "Failed to fetch invite competition." });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const { inviteLink, user_id, imageUrl } = req.body;

    if (!inviteLink || !user_id || !imageUrl) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const competition = await Competition.findOne({
      where: { invite_link: inviteLink, match_type: "invite_friend", status: "Waiting" },
      include: [{ model: Contest }],
    });

    if (!competition) {
      return res.status(404).json({ message: "Invalid or expired invite link." });
    }

    if (competition.user1_id === user_id) {
      return res.status(400).json({ message: "You cannot join your own invite." });
    }

    if (competition.user2_id) {
      return res.status(400).json({ message: "This competition already has two players." });
    }

    const wallet = await Wallet.findOne({ where: { user_id } });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    const entryFee = competition.Contest.entry_fee ?? 0;

    if (wallet.token_balance < entryFee) {
      return res.status(400).json({ message: "Insufficient tokens to join competition." });
    }

    // Deduct tokens
    wallet.token_balance -= entryFee;
    await wallet.save();

    // Update competition
    competition.user2_id = user_id;
    competition.user2_image = imageUrl;
    competition.status = "Active";
    await competition.save();

    res.status(200).json({
      message: "Successfully joined competition!",
      competition,
      new_balance: wallet.token_balance,
    });
  } catch (error) {
    console.error("❌ Error accepting invite:", error);
    res.status(500).json({ message: "Server error accepting invite.", error: error.message });
  }
};

const emailInviteLink = async (req, res) => {
  try {
    const { email, inviterName, inviteLink } = req.body;

    if (!email || !inviterName || !inviteLink) {
      return res.status(400).json({ message: "Missing fields." });
    }

    await sendInviteEmail(email, inviterName, inviteLink);
    res.status(200).json({ message: "Invite email sent successfully." });

  } catch (error) {
    console.error("❌ Error sending invite email:", error.message);
    res.status(500).json({ message: "Failed to send invite email.", error: error.message });
  }
};


// ✅ Ensure all functions are correctly exported
module.exports = {
  getUploadURL,
  updateImage,
  uploadImage,
  confirmPayment,
  enterCompetition,
  getCompetitionStatus, // ✅ Fix: Ensure this function exists before exporting
  confirmSubmission,
  getInviteCompetition, // ✅ Fix: Ensure this function exists before exporting
  acceptInvite,
  emailInviteLink,
};
