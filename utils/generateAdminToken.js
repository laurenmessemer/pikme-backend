const jwt = require("jsonwebtoken");

const adminPayload = {
  id: "12", // Replace with your admin user's ID from the database
  role: "admin", // Ensure the role matches your admin role in the database
};

const secret = process.env.JWT_SECRET; 
const options = { expiresIn: "1h" };

try {
  const token = jwt.sign(adminPayload, secret, options);
  console.log("Admin JWT Token:", token);
} catch (err) {
  console.error("Error generating token:", err.message);
}
