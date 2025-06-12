const { Op, where } = require('sequelize');
const {
  Competition,
  User,
  Contest,
  Wallet,
  Winners,
  Theme,
  sequelize,
} = require('../models');
const addAlerts = require('./addAlerts');

const determineWinnersFunction = async () => {
  try {
    // get required contest data
    const competitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          attributes: ['id', 'entry_fee', 'voting_deadline'],
          where: {
            voting_deadline: {
              [Op.lte]: new Date(),
            },
          },
        },
        { model: User, as: 'User1', attributes: ['id', 'username'] },
        { model: User, as: 'User2', attributes: ['id', 'username'] },
      ],
      where: {
        status: {
          [Op.ne]: 'Complete', // Not equal to 'Complete'
        },
      },
    });

    let winnersUpdated = 0;

    let contestIds = [];
    for (const competition of competitions) {
      if (competition.status === 'Active') {
        let winnerUsername = null;
        let winnerEarnings = 0;

        let winnerId = null;
        let looserName = null;
        let isTied = false;
        let user1;
        let user2;

        if (competition.votes_user1 > competition.votes_user2) {
          winnerUsername = competition.User1.username;
          winnerEarnings = competition.Contest.entry_fee * 2;

          winnerId = competition.User1.id;
          looserName = competition.User2.username;
        } else if (competition.votes_user2 > competition.votes_user1) {
          winnerUsername = competition.User2.username;
          winnerEarnings = competition.Contest.entry_fee * 2;

          winnerId = competition.User2.id;
          looserName = competition.User1.username;
        } else {
          isTied = true;
          user1 = competition.User1.id;
          user2 = competition.User2.id;

          winnerUsername =
            competition.User1.username + ' & ' + competition.User2.username;
        }

        if (winnerUsername) {
          await competition.update({
            winner_username: winnerUsername,
            winner_earnings: winnerEarnings,
            status: 'Complete',
          });

          if (isTied) {
            // ✅ Update referring user's wallet
            const user1Wallet = await Wallet.findOne({
              where: { user_id: user1 },
            });

            if (user1Wallet) {
              user1Wallet.token_balance += Number(
                competition.Contest.entry_fee
              );

              user1Wallet.transaction_history = [
                ...(user1Wallet.transaction_history || []),
                {
                  type: 'Competition Win Reward',
                  description: `Reward for a tied competition against ${competition.User2.username}: +${competition.Contest.entry_fee} tokens`,
                  amount: Number(competition.Contest.entry_fee),
                  timestamp: new Date(),
                },
              ];
              await user1Wallet.save();

              await addAlerts({
                user_id: user1,
                title: `It's a Tie!`,
                message: `The match ended in a tie. No worries — your entry fee of ${competition.Contest.entry_fee} tokens has been returned to your wallet`,
              });
            }
            const user2Wallet = await Wallet.findOne({
              where: { user_id: user2 },
            });

            if (user2Wallet) {
              user2Wallet.token_balance += Number(
                competition.Contest.entry_fee
              );
              user2Wallet.transaction_history = [
                ...(user2Wallet.transaction_history || []),
                {
                  type: 'Competition Win Reward',
                  description: `Reward for a tied competition against ${competition.User1.username}: +${competition.Contest.entry_fee} tokens`,
                  amount: Number(competition.Contest.entry_fee),
                  timestamp: new Date(),
                },
              ];
              await user2Wallet.save();

              await addAlerts({
                user_id: user2,
                title: `It's a Tie!`,
                message: `The match ended in a tie. No worries — your entry fee of ${competition.Contest.entry_fee} tokens has been returned to your wallet`,
              });
            }
          } else {
            // ✅ Update referring user's wallet
            const winnerWallet = await Wallet.findOne({
              where: { user_id: winnerId },
            });

            if (winnerWallet) {
              winnerWallet.token_balance += Number(winnerEarnings);
              winnerWallet.transaction_history = [
                ...(winnerWallet.transaction_history || []),
                {
                  type: 'Competition Win Reward',
                  description: `Reward for winning a competition against ${looserName}: +${winnerEarnings} tokens`,
                  amount: Number(winnerEarnings),
                  timestamp: new Date(),
                },
              ];
              await winnerWallet.save();

              await addAlerts({
                user_id: winnerId,
                title: `You Won!`,
                message: `Amazing job! You've won the contest and earned 2x your entry fee — ${winnerEarnings} tokens have been added to your wallet.`,
              });
            }
          }

          winnersUpdated++;
        }
      } else {
        // If competition is 'Waiting', just mark it as 'Complete' without the winner logic
        await competition.update({
          status: 'Complete',
        });
      }

      const contest = await Contest.update(
        {
          status: 'Complete',
        },
        {
          where: {
            id: competition.Contest.id,
          },
        }
      );

      // addcontest id to contestIds array if not already present
      if (contestIds.indexOf(competition.Contest.id) === -1) {
        contestIds.push(competition.Contest.id);
      }
    }

    // update the winner bonus for all competitions in the contests that were updated
    const competition_winners = `
          WITH
              "competition_winners" AS (
                SELECT
                  C."id" AS "contest_id",
                  CT."id" AS "competition_id",
                  V."voted_for",
                  U."id",
                  U."is_uploaded",
                  COUNT(*) AS "total_votes",
                  DENSE_RANK() OVER (
                    PARTITION BY
                      CT."id"
                    ORDER BY
                      COUNT(*) DESC
                  ) AS "vote_rank",
                  MAX(V."createdAt") AS "last_vote"
                FROM
                  "Contests" C
                  JOIN "Competitions" CT ON C."id" = CT."contest_id"
                  JOIN "Votes" V ON CT."id" = V."competition_id"
                  JOIN "Users" U ON (
                    (V."voted_for" = 'user1' AND U."id" = CT."user1_id") OR 
                    (V."voted_for" = 'user2' AND U."id" = CT."user2_id")
                  )
                WHERE
                  C."voting_deadline"::DATE < CURRENT_DATE
                  AND C."id" in ('${contestIds.join(`','`)}')
                  AND U."is_uploaded" = false
                GROUP BY
                  C."id",
                  CT."id",
                  V."voted_for",
                  U."id",
                  U."is_uploaded"
                ORDER BY
                  C."id" ASC,
                  C."createdAt" DESC,
                  "total_votes" DESC,
                  MAX(V."createdAt") DESC
              ),`;

    const top_3_winners = `
              "top_3_winners" AS (
                SELECT
                  *,
                  ROW_NUMBER() OVER (
                    PARTITION BY
                      "contest_id"
                    ORDER BY
                      "total_votes" DESC
                  ) AS "contest_rank"
                FROM
                  "competition_winners"
                WHERE
                  "vote_rank" = 1
              )`;

    const finalSelect = `
        SELECT
              "contest_id",
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'competition_id',
                  "competition_id",
                  'voted_for',
                  "voted_for",
                  'total_votes',
                  "total_votes",
                  'contest_rank',
                  "contest_rank"
                )
              ) as "competition_winners"
            FROM
              "top_3_winners"
            WHERE
              "contest_rank" <= 3
            GROUP BY
              "contest_id"
            ORDER BY
              "contest_id"
        `;

    if (Array.isArray(contestIds) && contestIds.length > 0) {
      const queryString = competition_winners + top_3_winners + finalSelect;
      const result = await sequelize.query(queryString, {
        type: sequelize.QueryTypes.SELECT,
      });

      for (let i = 0; i < result.length; i++) {
        const contestData = result[i];
        const contest = await Contest.findByPk(contestData.contest_id, {
          include: [
            {
              model: Theme,
              as: 'Theme',
              attributes: ['id'],
            },
          ],
        });
        const winnersAmount = contest.winnings;
        const winnerRanks = ['first', 'second', 'third'];
        const rankSuffixes = ['st', 'nd', 'rd'];

        for (let j = 0; j < contestData.competition_winners.length; j++) {
          const competitionWinner = contestData.competition_winners[j];

          const competition = await Competition.findOne({
            where: {
              id: competitionWinner.competition_id,
            },
            include: [
              { model: User, as: 'User1', attributes: ['id', 'username'] },
              { model: User, as: 'User2', attributes: ['id', 'username'] },
            ],
          });

          if (!competition) {
            console.warn(
              '⚠️ Competition not found for ID:',
              competitionWinner.competition_id
            );
            continue;
          }

          let winnerUsername = null;
          let winnerEarnings = 0;

          let winnerId = null;
          if (competitionWinner.voted_for === 'user1') {
            winnerUsername = competition.User1.username;
            winnerEarnings = winnersAmount[winnerRanks[j]];

            winnerId = competition.User1.id;
          } else if (competitionWinner.voted_for === 'user2') {
            winnerUsername = competition.User2.username;
            winnerEarnings = winnersAmount[winnerRanks[j]];
            winnerId = competition.User2.id;
          }

          if (winnerUsername) {
            const winnerWallet = await Wallet.findOne({
              where: { user_id: winnerId },
            });

            if (winnerWallet) {
              winnerWallet.token_balance += Number(winnerEarnings);
              winnerWallet.transaction_history = [
                ...(winnerWallet.transaction_history || []),
                {
                  type: 'Contest Win Reward',
                  description: `Reward for winning a Contest with ${
                    Number(j) + 1
                  }${rankSuffixes[j]} place: +${winnerEarnings} tokens`,
                  amount: Number(winnerEarnings),
                  timestamp: new Date(),
                },
              ];

              await winnerWallet.save();
            }

            const createWinner = await Winners.create({
              contest_id: contestData.contest_id,
              competition_id: competitionWinner.competition_id,
              user_id: winnerId,
              winning_amount: winnerEarnings,
              position: Number(j) + 1,
            });
          }
        }
      }
    }
    return {
      success: true,
      message: `${winnersUpdated} competitions updated.`,
    };
  } catch (error) {
    console.error('❌ Error determining winners:', error);
    return {
      success: false,
      error: error,
      message: 'Server error while determining winners.',
    };
  }
};

module.exports = determineWinnersFunction;
