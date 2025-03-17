"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, "/../config/config.js"))[env];

const db = {};

let sequelize;

try {
  console.log("🔹 Initializing Sequelize...");
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  console.log("✅ Sequelize instance created.");
} catch (error) {
  console.error("❌ Error initializing Sequelize:", error.message);
  process.exit(1);
}

console.log("🔍 Checking database connection...");
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connection successful"))
  .catch(error => {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  });

console.log("🔍 Scanning models directory...");

// ✅ Load models
const modelFiles = fs.readdirSync(__dirname).filter(file => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".js" &&
    file.indexOf(".test.js") === -1
  );
});

console.log(`📌 Found ${modelFiles.length} models. Loading...`);

modelFiles.forEach((file) => {
  console.log(`📂 Loading model from: ${file}`);
  try {
    const modelImport = require(path.join(__dirname, file));

    if (typeof modelImport !== "function") {
      throw new Error(`Model file "${file}" does not export a function.`);
    }

    const model = modelImport(sequelize, Sequelize.DataTypes);

    if (!model || !model.name) {
      throw new Error(`Model file "${file}" did not return a valid model.`);
    }

    db[model.name] = model;
    console.log(`✅ Model loaded: ${model.name}`);
  } catch (error) {
    console.error(`❌ ERROR loading model "${file}": ${error.message}`);
  }
});

// ✅ Associate models (AFTER all models are loaded)
console.log("✅ All models loaded. Setting up associations...");
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`🔗 Associating model: ${modelName}`);
    try {
      db[modelName].associate(db);
    } catch (error) {
      console.error(`❌ ERROR associating model "${modelName}": ${error.message}`);
    }
  }
});

console.log("✅ All models associated.");

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log("📦 Sequelize setup complete.");

module.exports = db;
