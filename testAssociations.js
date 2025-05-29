const db = require('./models');

(async () => {
  await db.sequelize.sync({ force: false });

  await db.sequelize.close();
})();
