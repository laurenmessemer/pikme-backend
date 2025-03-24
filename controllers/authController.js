const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Wallet } = require("../models");

// ✅ Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let referredByUser = null;

    // ✅ Validate referral code if provided
    if (referralCode) {
      referredByUser = await User.findOne({ where: { referral_code: referralCode } });
      if (!referredByUser) {
        return res.status(400).json({ message: "Invalid referral code." });
      }
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Create new user
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role: "participant",
      referred_by_id: referredByUser ? referredByUser.id : null,
    });

    // ✅ Generate unique referral code (e.g., PIK000123)
    newUser.referral_code = `PIK${String(newUser.id).padStart(6, "0")}`;

    // ✅ Track whether bonus has been awarded (null if no referral)
    newUser.referral_bonus_awarded = referredByUser ? false : null;
    await newUser.save();

    // ✅ Build transaction history for new user's wallet
    const transactionHistory = [
      {
        type: "Joining Bonus",
        description: "Joining Bonus: +10 tokens",
        amount: 10,
        timestamp: new Date(),
      },
    ];

    let startingBalance = 10;

    // ✅ If referred, add referral bonus to both users
    if (referredByUser) {
      transactionHistory.push({
        type: "Referral Bonus",
        description: "Used referral code: +10 tokens",
        amount: 10,
        timestamp: new Date(),
      });

      // ⬆️ New user gets 10 extra tokens
      startingBalance += 10;

      // ✅ Update referring user's wallet
      const refWallet = await Wallet.findOne({ where: { user_id: referredByUser.id } });
      if (refWallet) {
        refWallet.token_balance += 10;
        refWallet.transaction_history = [
          ...(refWallet.transaction_history || []),
          {
            type: "Referral Reward",
            description: `Referral reward for inviting ${username}: +10 tokens`,
            amount: 10,
            timestamp: new Date(),
          },
        ];
        await refWallet.save();
      }

      // ✅ Mark bonus as awarded for tracking
      newUser.referral_bonus_awarded = true;
      await newUser.save();
    }

    // ✅ Create wallet for the new user
    await Wallet.create({
      user_id: newUser.id,
      token_balance: startingBalance,
      transaction_history: transactionHistory,
    });

    // ✅ Return full user object to frontend (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        referral_code: newUser.referral_code,
        referred_by_id: newUser.referred_by_id,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ✅ Login User or Admin
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      attributes: ["id", "username", "email", "role", "password_hash"],
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Logged-in User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Fetch User Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
