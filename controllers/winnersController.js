const { Competition, User, Contest, Theme, sequelize } = require('../models');

// ✅ Determine winners
const determineWinners = async (req, res) => {
  try {
    const now = new Date();
    const competitions = await Competition.findAll({
      include: [
        { model: Contest, attributes: ['entry_fee', 'voting_deadline'] },
        { model: User, as: 'User1', attributes: ['id', 'username'] },
        { model: User, as: 'User2', attributes: ['id', 'username'] },
      ],
      where: {
        status: 'Active',
      },
    });

    let winnersUpdated = 0;

    for (const competition of competitions) {
      if (new Date(competition.Contest.voting_deadline) <= now) {
        let winnerUsername = null;
        let winnerEarnings = 0;

        if (competition.votes_user1 > competition.votes_user2) {
          winnerUsername = competition.User1.username;
          winnerEarnings = competition.Contest.entry_fee * 2;
        } else if (competition.votes_user2 > competition.votes_user1) {
          winnerUsername = competition.User2.username;
          winnerEarnings = competition.Contest.entry_fee * 2;
        }

        if (winnerUsername) {
          await competition.update({
            winner_username: winnerUsername,
            winner_earnings: winnerEarnings,
            status: 'Complete',
          });

          winnersUpdated++;
        }
      }
    }

    res.json({
      success: true,
      message: `${winnersUpdated} competitions updated.`,
    });
  } catch (error) {
    console.error('❌ Error determining winners:', error);
    res.status(500).json({ error: 'Server error while determining winners.' });
  }
};

// ✅ Get winners for frontend
const getWinners = async (req, res) => {
  try {
    const completedCompetitions = await Competition.findAll({
      where: { status: 'Complete' },
      include: [
        {
          model: Contest,
          include: [{ model: Theme, as: 'Theme' }],
        },
        { model: User, as: 'User1', attributes: ['username'] },
        { model: User, as: 'User2', attributes: ['username'] },
      ],
    });

    const winners = completedCompetitions.map((comp) => {
      const isUser1Winner = comp.votes_user1 > comp.votes_user2;
      const winner = isUser1Winner ? comp.User1 : comp.User2;
      return {
        image: isUser1Winner ? comp.user1_image : comp.user2_image,
        username: winner?.username || 'Unknown',
        contestId: comp.contest_id,
        payout: comp.winner_earnings,
        totalVotes: comp.votes_user1 + comp.votes_user2,
        startDate: comp.Contest?.contest_live_date,
        endDate: comp.Contest?.voting_deadline,
        Theme: comp.Contest?.Theme || {},
      };
    });

    res.json({ success: true, winners });
  } catch (err) {
    console.error('❌ Failed to fetch winners:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Get the Winner Listing with the theme and contest Id
 * @routes (GET /)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const getWinnersV2 = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    let queryString = `
    SELECT
      C."id" AS "contest_id",
      T."id" AS "theme_id",
      T."name",
      T."description",
      C."voting_deadline" as "endDate",
      C."contest_live_date" as "startDate",
      T."special_rules",
      T."cover_image_url",
      (select count(*) from "Competitions" where "contest_id" = C."id") as "totalParticipants",
      C."status",
      C."createdAt",
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'username',
          U."username",
          'image',
          CASE
            WHEN CT."user1_id" = U."id" THEN CT."user1_image"
            ELSE CT."user1_image"
          END,
          'totalVotes',
          CASE
            WHEN CT."user1_id" = U."id" THEN CT."votes_user1"
            ELSE CT."votes_user2"
          END,
          'payout',
          W."winning_amount",
          'position',
          W."position"
        )
      ) as "winners"
    FROM
      "Winners" W
      JOIN "Contests" C ON C."id" = W."contest_id"
      JOIN "Themes" T ON T."id" = C."theme_id"
      JOIN "Competitions" CT ON CT."id" = W."competition_id"
      JOIN "Users" U ON U."id" = W."user_id"
      AND U."suspended" = FALSE
      AND U."is_verified" = TRUE
      AND U."role" = 'participant'
    GROUP BY
      C."id",
      T."id",
      T."name",
      T."description",
      C."voting_deadline",
      T."special_rules",
      T."cover_image_url",
      C."status",
      C."createdAt"
    ORDER BY
      C."voting_deadline" DESC,
      C."createdAt" DESC
    `;

    const resultCount = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    if (limit >= 0 && skip >= 0) {
      queryString += ` LIMIT ${limit} OFFSET ${skip}`;
    }

    const result = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.json({
      success: true,
      winners: result,
      winnersCount: resultCount.length,
    });
  } catch (error) {
    console.error('❌ Error fetching winners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching winners.',
    });
  }
};

// ✅ Properly export both
module.exports = {
  determineWinners,
  getWinners,
  getWinnersV2,
};
