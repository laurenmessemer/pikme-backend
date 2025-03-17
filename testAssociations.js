const db = require("./models");

(async () => {
  await db.sequelize.sync({ force: false });

  console.log("Vote Associations:", db.Vote.associations);
  console.log("User Associations:", db.User.associations);

  await db.sequelize.close();
})();
