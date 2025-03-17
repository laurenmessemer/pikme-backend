const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format. Expected 'Bearer <token>'" });
    }

    const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);

    if (!decoded || !decoded.role) {
      return res.status(403).json({ message: "Invalid or missing role in token." });
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};

module.exports = authMiddleware;
