const { Sequelize } = require("sequelize");
require("dotenv").config();

// Ensure environment variables are loaded correctly
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_PORT) {
  console.error("❌ Missing required environment variables. Check your .env file.");
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: false, // Set to 'console.log' for debugging SQL queries
  }
);

// Test DB connection
sequelize.authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch(err => {
    console.error("❌ Unable to connect to the database:", err);
    process.exit(1);
  });

module.exports = sequelize;




// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//     port: process.env.DB_PORT,
//   }
// );

// module.exports = sequelize;