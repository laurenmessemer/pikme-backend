const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// ✅ Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// ✅ Register New User
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

    // ✅ Generate referral code for new user (e.g., PIK000123)
    const referralCodeForNewUser = `PIK${String(newUser.id).padStart(6, "0")}`;
    newUser.referral_code = referralCodeForNewUser;

    // ✅ Save referral code
    await newUser.save();

    // (Optional) Flag for later bonus awarding
    // newUser.referral_bonus_awarded = false;

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id,
      referralCode: newUser.referral_code,
      referralUsed: referralCode || null,
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
