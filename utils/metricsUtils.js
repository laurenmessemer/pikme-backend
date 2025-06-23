const { Op } = require('sequelize');
const moment = require('moment');

exports.getDateFilters = () => {
  const now = moment.tz('America/New_York');

  // Start of current year
  const startOfYear = now.clone().startOf('year').toDate();

  // Start of current month
  const startOfMonth = now.clone().startOf('month').toDate();

  // Start of last month
  const startOfLastMonth = now
    .clone()
    .subtract(1, 'month')
    .startOf('month')
    .toDate();

  // End of last month
  const endOfLastMonth = now
    .clone()
    .startOf('month')
    .subtract(1, 'day')
    .endOf('day')
    .toDate();

  // 7 days ago from now
  const sevenDaysAgo = now.clone().subtract(7, 'days').toDate();

  // Start of this week (Sunday)
  const startOfThisWeek = now.clone().startOf('week').toDate();

  // Start of last week (previous Sunday)
  const startOfLastWeek = now
    .clone()
    .startOf('week')
    .subtract(1, 'week')
    .toDate();

  // End of last week (Saturday)
  const endOfLastWeek = now
    .clone()
    .startOf('week')
    .subtract(1, 'day')
    .endOf('day')
    .toDate();

  // const now = new Date();

  // const startOfYear = new Date(now.getFullYear(), 0, 1);
  // const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // const sevenDaysAgo = new Date(now);
  // sevenDaysAgo.setDate(now.getDate() - 7);

  // const startOfThisWeek = new Date(now);
  // startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday

  // const startOfLastWeek = new Date(startOfThisWeek);
  // startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  // const endOfLastWeek = new Date(startOfThisWeek);
  // endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);

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
