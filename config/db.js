require("dotenv").config();
const { Sequelize } = require("sequelize");

console.log("✅ ENV VARIABLES LOADED");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);


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
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
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