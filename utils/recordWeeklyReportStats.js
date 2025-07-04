const { sequelize, WeeklyReportStats, Report } = require('../models');
const { Sequelize } = require('sequelize');
const moment = require('moment');

/**
 * Record the last week reports stats
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.recordWeeklyReportStats = async () => {
  // Get current date
  const today = moment.tz('America/New_York');

  // Get the previous week's Monday 00:00:00
  const lastWeekStart = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'week')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  // Get the previous week's Sunday 23:59:59
  const lastWeekEnd = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'day')
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  // return true;
  try {
    // Fetch all voters and their first vote times, grouped by voter
    const queryString = `
      SELECT
        (
          SELECT
            COUNT(*)
          FROM
            "Competitions"
          WHERE
            "createdAt" > '${lastWeekStart}'
            AND "createdAt" < '${lastWeekEnd}'
        ) + (
          SELECT
            COUNT(*)
          FROM
            "Competitions"
          WHERE
            "user2_join_date" > '${lastWeekStart}'
            AND "user2_join_date" < '${lastWeekEnd}'
        ) AS TOTAL_COUNT;`;

    const results = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    const reportCount = await Report.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: lastWeekStart,
          [Sequelize.Op.lte]: lastWeekEnd,
        },
      },
    });

    // Insert or update the weekly stats record
    await WeeklyReportStats.upsert({
      weekStart: lastWeekStart.slice(0, 10),
      reportCount: reportCount,
      totalImagesCount: Number(results[0].total_count),
    });
  } catch (err) {
    console.error('❌ Error in recordWeeklyReportStats:', err);
    throw err;
  }
};
