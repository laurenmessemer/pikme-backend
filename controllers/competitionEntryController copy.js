const { Competition, Contest, User, Wallet, Op } = require("../models");
const crypto = require("crypto");

// ✅ Step 1: Enter Competition
exports.enterCompetition = async (req, res) => {
    const { user_id, contest_id, image_url } = req.body;

    try {
        if (!user_id || !contest_id) {
            return res.status(400).json({ message: "Missing required fields: user_id or contest_id" });
        }

        // ✅ Debugging Log
        console.log("📩 Received Data:", { user_id, contest_id, image_url });

        const contest = await Contest.findByPk(contest_id);
        if (!contest) return res.status(404).json({ message: "Contest not found" });

        const existingEntry = await Competition.findOne({ where: { contest_id, user1_id: user_id } });
        if (existingEntry) return res.status(400).json({ message: "You have already entered this contest!" });

        if (!image_url) {
            return res.status(400).json({ message: "Image is required to enter the competition." });
        }

        const newEntry = await Competition.create({
            contest_id,
            user1_id: user_id,
            user1_image: image_url,
            status: "Waiting",
        });

        res.status(201).json({ message: "Entry started!", competition: newEntry });
    } catch (error) {
        console.error("❌ Error entering competition:", error);
        res.status(500).json({ message: "Error entering competition", error: error.message });
    }
};

  
// ✅ Step 2: Upload Image
exports.uploadEntryImage = async (req, res) => {
  const { user_id, contest_id, image_url } = req.body;

  try {
    const entry = await Competition.findOne({
      where: { contest_id, user1_id: user_id },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found!" });
    }

    entry.user1_image = image_url;
    await entry.save();

    res.status(200).json({ message: "Image uploaded successfully!", entry });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image", error: error.message });
  }
};

// ✅ Step 3: Choose Opponent
exports.chooseOpponent = async (req, res) => {
  const { user_id, contest_id, opponent_id } = req.body;

  try {
    const entry = await Competition.findOne({
      where: { contest_id, user1_id: user_id },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found!" });
    }

    if (opponent_id) {
      // ✅ If user selected a specific opponent (Challenge Friend)
      const friend = await User.findByPk(opponent_id);
      if (!friend) return res.status(404).json({ message: "Opponent not found" });

      entry.challenge_friend_id = opponent_id;
    } else {
      // ✅ If user chose "Pick for Me" → Try to match them
      const opponent = await Competition.findOne({
        where: {
          contest_id,
          status: "Waiting",
          user1_id: { [Op.ne]: user_id },
          user2_id: null,
        },
      });

      if (opponent) {
        opponent.user2_id = user_id;
        opponent.status = "Active";
        await opponent.save();

        res.status(200).json({ message: "You've been matched!", competition: opponent });
        return;
      }
    }

    await entry.save();
    res.status(200).json({ message: "Opponent selection updated!", entry });
  } catch (error) {
    console.error("Error choosing opponent:", error);
    res.status(500).json({ message: "Error choosing opponent", error: error.message });
  }
};


// ✅ Step 4: Use Token to Enter
exports.useTokenForEntry = async (req, res) => {
  const { user_id, contest_id, opponent_id, user1_image } = req.body;

  console.log("🚀 Incoming Token Deduction Request:", req.body);

  try {
    if (!user1_image) {
      return res.status(400).json({ message: "Image is required to enter the competition." });
    }

    const wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      return res.status(400).json({ message: "Wallet not found!" });
    }

    const contest = await Contest.findByPk(contest_id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found!" });
    }

    const entryFee = contest.entry_fee;
    if (wallet.token_balance < entryFee) {
      return res.status(400).json({ message: "Insufficient tokens!" });
    }

    let entry = await Competition.findOne({
      where: { contest_id, user2_id: null, status: "Waiting" },
    });

    if (entry) {
      console.log("✅ Open competition found. Joining...");
      entry.user2_id = user_id;
      entry.user2_image = user1_image;
      entry.status = "Active"; 
      await entry.save();
    } else {
      console.log("⚠️ No open competitions available. Creating a new one...");

      entry = await Competition.create({
        contest_id,
        user1_id: user_id,
        user1_image,
        user2_id: opponent_id || null,
        user2_image: opponent_id ? null : undefined,
        status: opponent_id ? "Waiting" : "Active",
      });
    }

    console.log("✅ Deducting tokens. Before:", wallet.token_balance);
    wallet.token_balance -= entryFee;
    await wallet.save();

    console.log("✅ Tokens deducted. New Balance:", wallet.token_balance);

    res.status(200).json({
      message: "Tokens deducted successfully!",
      new_balance: wallet.token_balance,
      competition: entry,
    });
  } catch (error) {
    console.error("❌ Error using token:", error);
    res.status(500).json({ message: "Error using token", error: error.message });
  }
};

// ✅ Step: Find an Open Competition
exports.findOpenCompetition = async (req, res) => {
  const { contest_id } = req.query;

  try {
    const openCompetition = await Competition.findOne({
      where: {
        contest_id,
        user2_id: null,
        status: "Waiting",
      },
    });

    if (!openCompetition) {
      return res.status(200).json({ open_competition: null, message: "No open competition found." });
    }

    res.status(200).json({ open_competition: openCompetition });
  } catch (error) {
    console.error("❌ Error finding open competition:", error);
    res.status(500).json({ message: "Error finding open competition", error: error.message });
  }
};


exports.checkOrCreateEntry = async (req, res) => {
  const { user_id, contest_id, opponent_id, user1_image } = req.body;

  console.log("🚀 Checking or creating competition entry:", req.body);

  try {
      if (!user1_image) {
          console.error("❌ Missing user1_image in request!");
          return res.status(400).json({ message: "Image is required to enter the competition." });
      }

      // ✅ Find an open competition if user is not inviting a specific opponent
      let entry = null;
      if (!opponent_id) {
          entry = await Competition.findOne({
              where: { contest_id, user2_id: null },
          });
      }

      // ✅ If an open competition exists, join it
      if (entry) {
          entry.user2_id = user_id;
          entry.status = "Full";
          await entry.save();
          return res.status(200).json({ message: "Joined an open competition", competition_id: entry.id });
      }

      // ✅ Otherwise, create a new competition (User must be first entrant)
      console.log("⚠️ No open competitions available. Creating a new one...");

      const newEntry = await Competition.create({
          contest_id,
          user1_id: user_id,
          user1_image, // ✅ Ensure user1_image is set
          user2_id: opponent_id || null,
          status: opponent_id ? "WaitingForOpponent" : "Open",
      });

      return res.status(201).json({
          message: opponent_id ? "Competition created with invited opponent" : "New open competition created",
          competition_id: newEntry.id,
      });
  } catch (error) {
      console.error("❌ Error checking/creating competition:", error);
      res.status(500).json({ message: "Error checking or creating competition", error: error.message });
  }
};

// ✅ Generate a unique invite code
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase(); // Example: 'A3B7F9D1'
    
    const existingCompetition = await Competition.findOne({
      where: { challenge_invite_code: code },
    });

    if (!existingCompetition) {
      isUnique = true;
    }
  }
  return code;
};

// ✅ Route to generate an invite code
exports.generateInviteCode = async (req, res) => {
  console.log("📩 Incoming request to generate invite:", req.body);

  const { user_id, contest_id } = req.body;

  if (!user_id || !contest_id) {
    console.error("❌ Missing user_id or contest_id!");
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    let competition = await Competition.findOne({
      where: { user1_id: user_id, contest_id },
    });

    if (!competition) {
      console.error("❌ No active competition found for this user.");
      return res.status(404).json({ message: "No active competition found." });
    }

    if (competition.challenge_invite_code) {
      console.log("✅ Returning existing invite code:", competition.challenge_invite_code);
      return res.status(200).json({ invite_code: competition.challenge_invite_code });
    }

    const inviteCode = await generateUniqueCode();
    competition.challenge_invite_code = inviteCode;
    await competition.save();

    console.log("🎟️ New Invite Code Generated:", inviteCode);
    return res.status(201).json({ invite_code: inviteCode });

  } catch (error) {
    console.error("❌ Error generating invite code:", error);
    return res.status(500).json({ message: "Error generating invite code", error: error.message });
  }
};


// ✅ Step 5: Confirm Submission
exports.confirmSubmission = async (req, res) => {
  const { user_id, contest_id } = req.body;

  try {
    const entry = await Competition.findOne({
      where: { contest_id, user1_id: user_id },
    });

    if (!entry) return res.status(404).json({ message: "Entry not found!" });

    entry.status = "Complete";
    await entry.save();

    res.status(200).json({ message: "Entry confirmed!" });
  } catch (error) {
    console.error("Error confirming submission:", error);
    res.status(500).json({ message: "Error confirming submission", error: error.message });
  }
};

// ✅ Step 6: Get Competition Status
exports.getCompetitionStatus = async (req, res) => {
  const { user_id, contest_id } = req.query;

  try {
    const competition = await Competition.findOne({
      where: { contest_id, user1_id: user_id },
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found!" });
    }

    res.status(200).json({
      status: competition.status,
      invite_link: competition.challenge_friend_id 
        ? `https://pikme.com/headtoheadfriendinvite`
        : null,
    });
  } catch (error) {
    console.error("❌ Error fetching competition status:", error);
    res.status(500).json({ error: "Error fetching competition status" });
  }
};
