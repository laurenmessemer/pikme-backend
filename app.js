require("dotenv").config();
console.log("DB HOST:", process.env.DB_HOST);
console.log("Bucket Name:", process.env.S3_BUCKET_NAME); 
const express = require("express");
const sequelize = require("./config/db");
const path = require("path");
const fileUpload = require("express-fileupload");
require("./models");


// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes"); 
const themeRoutes = require("./routes/themeRoutes"); 
const contestRoutes = require("./routes/contestRoutes");
const competitionEntryRoutes = require("./routes/competitionEntryRoutes");
const walletRoutes = require("./routes/walletRoutes");
const voteRoutes = require("./routes/voteRoutes");
const LeaderboardRoutes = require("./routes/leaderboardRoutes");
const WinnersRoutes = require("./routes/winnersRoutes");
const adminCompetitionRoutes = require("./routes/adminCompetitionRoutes");
const webhookRoutes = require("./webhook");
const referralRoutes = require("./routes/referralRoutes");
const activityRoutes = require("./routes/activityRoutes");
const reportRoutes = require("./routes/reportRoutes"); 
const contactRoutes = require("./routes/contactRoutes"); 
const metricsRoutes = require("./routes/metricsRoutes"); 

const app = express();
app.use(fileUpload()); 


app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// ✅ Middleware
const cors = require("cors");

const allowedOrigins = [
  "https://www.playpikme.com",
  "http://localhost:5173" // 👈 Add this
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
};

// ✅ Use CORS Middleware
app.use(cors(corsOptions));

// ✅ Manually set CORS headers (for extra protection)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200).end;
  }

  next();
});

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
app.use("/api/competitions", adminCompetitionRoutes);
app.use("/webhook", webhookRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/reports", reportRoutes); 
app.use("/api", contactRoutes);
app.use("/api/metrics", metricsRoutes);



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
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
    
  })
  .catch((err) => console.error("❌ Database sync error:", err));
