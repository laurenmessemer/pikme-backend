const { Op } = require("sequelize");

exports.getDateFilters = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  return {
    all_time: {}, // no filter
    ytd: { createdAt: { [Op.gte]: startOfYear } },
    this_month: { createdAt: { [Op.gte]: startOfMonth } },
    last_week: { createdAt: { [Op.gte]: lastWeek } },
  };
};
