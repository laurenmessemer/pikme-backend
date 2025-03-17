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
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role: "participant", // ✅ Default role
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
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
