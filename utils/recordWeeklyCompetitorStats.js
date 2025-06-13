const { Competition, sequelize, WeeklyCompetitorStats } = require('../models');
const { Sequelize } = require('sequelize');
const moment = require('moment');

exports.recordWeeklyCompetitorStats = async () => {
  // Get current date
  const today = moment();

  // Get the previous week's Monday 00:00:00
  const lastWeekStart = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'week')
    .startOf('day')
    .toDate();

  // Get the previous week's Sunday 23:59:59
  const lastWeekEnd = today
    .clone()
    .startOf('isoWeek')
    .subtract(1, 'day')
    .endOf('day')
    .toDate();

  // return true;
  try {
    // Fetch all voters and their first vote times, grouped by voter
    const queryString = `
      WITH
        "user1_competitions" AS (
          SELECT
            "user1_id" AS "userId",
            MIN("createdAt") AS "first_time_join"
          FROM
            "Competitions"
          WHERE "user1_id" is not null
          GROUP BY
            "user1_id"
        ),
        "user2_competitions" AS (
          SELECT
            "user2_id" AS "userId",
            MIN("user2_join_date") AS "first_time_join"
          FROM
            "Competitions"
          WHERE "user2_id" is not null
          GROUP BY
            "user2_id"
        ),
        "combined_users" AS (
          SELECT
            *
          FROM
            "user1_competitions"
          UNION ALL
          SELECT
            *
          FROM
            "user2_competitions"
        )
      SELECT
        "userId",
        MIN("first_time_join") AS "first_time_join"
      FROM
        "combined_users" CB JOIN "Users" U ON CB."userId" = U.id
      WHERE U."is_uploaded" = FALSE
      GROUP BY
        "userId"
      ORDER BY
        "userId";`;

    const results = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    const newCompetitorIds = new Set();
    const repeatCompetitorIds = new Set();

    for (const result of results) {
      const firstCompetition = new Date(result.first_time_join);
      if (firstCompetition >= lastWeekStart && firstCompetition < lastWeekEnd) {
        newCompetitorIds.add(result.userId);
      } else {
        // Check if they voted again during last week
        const asUser1 = await Competition.findOne({
          attributes: ['user1_id', 'user2_id'],
          where: {
            user1_id: result.userId,
            createdAt: {
              [Sequelize.Op.gte]: lastWeekStart,
              [Sequelize.Op.lt]: lastWeekEnd,
            },
          },
          raw: true,
        });

        const asUser2 = await Competition.findOne({
          attributes: ['user1_id', 'user2_id'],
          where: {
            user2_id: result.userId,
            user2_join_date: {
              [Sequelize.Op.gte]: lastWeekStart,
              [Sequelize.Op.lt]: lastWeekEnd,
            },
          },
          raw: true,
        });

        if (asUser1 || asUser2) {
          repeatCompetitorIds.add(result.userId);
        }
      }
    }

    // Insert or update the weekly stats record
    await WeeklyCompetitorStats.upsert({
      weekStart: lastWeekStart.toISOString().slice(0, 10),
      newCompetitor: newCompetitorIds.size,
      repeatCompetitor: repeatCompetitorIds.size,
    });
  } catch (err) {
    console.error('❌ Error in recordWeeklyCompetitorStats:', err);
    throw err;
  }
};
