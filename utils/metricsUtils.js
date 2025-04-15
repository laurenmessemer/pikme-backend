const { Op } = require("sequelize");

exports.getDateFilters = () => {
  const now = new Date();

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);

  return {
    all_time: {},

    ytd: {
      createdAt: { [Op.gte]: startOfYear },
    },

    this_month: {
      createdAt: { [Op.gte]: startOfMonth },
    },

    last_month: {
      createdAt: {
        [Op.gte]: startOfLastMonth,
        [Op.lte]: endOfLastMonth,
      },
    },

    this_week: {
      createdAt: { [Op.gte]: startOfThisWeek },
    },

    last_week: {
      createdAt: {
        [Op.gte]: startOfLastWeek,
        [Op.lte]: endOfLastWeek,
      },
    },
  };
};
