const User = require('./models/User');
const sequelize = require('./config/db');

async function testUserCreation() {
  try {
    // ✅ Valid User Data
    const validUser = await User.create({
      username: "testuser",
      email: "testuser@example.com",
      password_hash: "hashedpassword123", // 🛠️ Updated field name
    });
    console.log("✅ User created successfully:", validUser.toJSON());

  } catch (error) {
    console.error("Unexpected error:", error);
  } finally {
    await sequelize.close(); // Close DB connection after tests
  }
}

testUserCreation();
