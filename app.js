require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');
const path = require('path');
const fileUpload = require('express-fileupload');
require('./models');

// ✅ Add cron + controller
const cron = require('node-cron');
const { recordWeeklyVoterStats } = require('./utils/recordWeeklyVoterStats');

// ✅ Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const themeRoutes = require('./routes/themeRoutes');
const contestRoutes = require('./routes/contestRoutes');
const competitionEntryRoutes = require('./routes/competitionEntryRoutes');
const walletRoutes = require('./routes/walletRoutes');
const voteRoutes = require('./routes/voteRoutes');
const LeaderboardRoutes = require('./routes/leaderboardRoutes');
const WinnersRoutes = require('./routes/winnersRoutes');
const adminCompetitionRoutes = require('./routes/adminCompetitionRoutes');
const webhookRoutes = require('./webhook');
const referralRoutes = require('./routes/referralRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const alertRoutes = require('./routes/alertsRoutes');

const app = express();
app.use(fileUpload());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Middleware
const cors = require('cors');
const determineWinnersFunction = require('./utils/determineWinners');
const weeklyTopVoters = require('./utils/weeklyTopVoters');
const weeklyTopReferrers = require('./utils/weeklyTopReferrers');

const allowedOrigins = [
  'https://pikme.zignuts.dev',
  'https://www.playpikme.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'ngrok-skip-browser-warning',
  ],
};

// ✅ Use CORS Middleware
app.use(cors(corsOptions));

// ✅ Manually set CORS headers (for extra protection)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'ngrok-skip-browser-warning'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200).end;
  }

  next();
});

// ✅ Increase Payload Size Limit to Prevent 413 Error
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // ✅ Add User Routes
app.use('/api/themes', themeRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/competition-entry', competitionEntryRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/vote', voteRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/winners', WinnersRoutes);
app.use('/api/leaderboard', LeaderboardRoutes);
app.use('/api/competitions', adminCompetitionRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', contactRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/alerts', alertRoutes);

// ✅ Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the PikMe API');
});

// ✅ Handle Undefined Routes (404 Error)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal Server Error' });
});

// ✅ Cron Job: Save Weekly Voter Stats Every Monday 12:05 AM
cron.schedule('5 0 * * 1', async () => {
  console.log('📊 Running weekly voter stats cron...');
  try {
    await recordWeeklyVoterStats();
    await determineWinnersFunction();
    console.log('✅ Weekly voter stats recorded.');
  } catch (err) {
    console.error('❌ Failed to record weekly voter stats:', err.message);
  }
});

// ✅ Cron Job: Weekly Voter and Referrers Every Sunday 23:55 PM
cron.schedule('55 23 * * 0', async () => {
  console.log('Weekly Top Voters and Referrers Winners');
  try {
    await weeklyTopVoters();
    await weeklyTopReferrers();
    console.log('✅ Weekly Top Voters and Referrers Winners');
  } catch (err) {
    console.error('❌ Failed to record weekly voter stats:', err.message);
  }
});

// ✅ Sync Database and Start Server
sequelize
  .sync({ alter: true }) // ❗ Only use `{ alter: true }` in dev
  .then(async () => {
    console.log('✅ Database synced successfully');

    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://127.0.0.1:${PORT}`)
    );
  })
  .catch((err) => console.error('❌ Database sync error:', err));
