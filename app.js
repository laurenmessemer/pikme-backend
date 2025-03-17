require("dotenv").config();
console.log("DB HOST:", process.env.DB_HOST);
console.log("Bucket Name:", process.env.S3_BUCKET_NAME);  // Debugging step
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const path = require("path");
require("./models"); // ✅ Ensures all models & associations are loaded


// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Add User Routes
const themeRoutes = require("./routes/themeRoutes"); 
const contestRoutes = require("./routes/contestRoutes");
const competitionEntryRoutes = require("./routes/competitionEntryRoutes");
const walletRoutes = require("./routes/walletRoutes");
const voteRoutes = require("./routes/voteRoutes");
const LeaderboardRoutes = require("./routes/leaderboardRoutes");
const WinnersRoutes = require("./routes/winnersRoutes");
const adminCompetitionRoutes = require("./routes/adminCompetitionRoutes");

const app = express();


// ✅ Middleware
app.use(cors({ 
  origin: ["http://localhost:5173", process.env.CLIENT_URL], // ✅ Allow multiple origins
  credentials: true,
}));

// ✅ Increase Payload Size Limit to Prevent 413 Error
app.use(express.json({ limit: "20mb" })); 
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // ✅ Add User Routes
app.use("/api/themes", themeRoutes); 
app.use("/api/contests", contestRoutes);
app.use("/api/competition-entry", competitionEntryRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/vote", voteRoutes); 
app.use("/uploads", express.static("uploads"));
app.use("/api/winners", WinnersRoutes);
app.use("/api/leaderboard", LeaderboardRoutes);
console.log("✅ Registering Admin Competitions Route...");
app.use("/api/competitions", adminCompetitionRoutes);


// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Welcome to the PikMe API");
});

// ✅ Handle Undefined Routes (404 Error)
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Sync Database and Start Server
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected successfully");
    return sequelize.sync({ alter: true });  // ❗ Only use `{ alter: true }` in dev
  })
  .then(() => {
    console.log("✅ Database synced successfully");
    const PORT = process.env.PORT || 5004;
    
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("❌ Database sync error:", err));
