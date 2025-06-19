const { Competition, Contest, Theme, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const sendInviteEmail = require('../utils/sendInviteEmail');

exports.getUserSubmissions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({ success: true, submissions: [] });
    }

    // ✅ Fetch competitions where the user is user1 or user2
    const competitions = await Competition.findAll({
      where: {
        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
      },
      include: [
        {
          model: Contest,
          attributes: ['status'],
          include: [
            {
              model: Theme,
              as: 'Theme',
              attributes: ['name'],
            },
          ],
        },
        {
          model: User,
          as: 'User1',
          attributes: ['id', 'username'],
        },
        {
          model: User,
          as: 'User2',
          attributes: ['id', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // ✅ Format response
    const formattedSubmissions = competitions.map((comp) => ({
      id: comp.id,
      image:
        comp.user1_id === parseInt(userId)
          ? comp.user1_image
          : comp.user2_image,
      username:
        comp.user1_id === parseInt(userId)
          ? comp.User1?.username || 'Me'
          : comp.User2?.username || 'Me',
      theme: comp.Contest?.Theme?.name || 'Unknown Theme', // ✅ Fetch theme name correctly
      contestStatus: comp.Contest.status, // ✅ Fetch contest status from Contest
      position: 'N/A', // ✅ Update if needed
      payout: '0', // ✅ Update if payouts are tracked
    }));

    return res.json({ success: true, submissions: formattedSubmissions });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Server error while fetching submissions.' });
  }
};

exports.getWinners = async (req, res) => {
  try {
    const winners = await Competition.findAll({
      where: { status: 'Complete' }, // ✅ Only fetch completed competitions
      include: [
        {
          model: Contest,
          attributes: [
            'id',
            'theme_id',
            'entry_fee',
            'voting_deadline',
            'contest_live_date',
            'total_entries',
          ],
          include: [
            {
              model: Theme,
              as: 'Theme', // ✅ Ensure correct alias matching in the query
              attributes: ['name'], // ✅ Fetch the theme name
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    if (!winners || winners.length === 0) {
      return res.json({ success: true, winners: [] });
    }

    // ✅ Map and structure the winners data
    const formattedWinners = winners.map((comp) => {
      // Determine winner based on vote counts
      let winnerImage =
        'https://photo-contest-storage.s3.us-east-2.amazonaws.com/uploads/default.jpg'; // Default placeholder
      if (comp.votes_user1 > comp.votes_user2) {
        winnerImage = comp.user1_image;
      } else if (comp.votes_user2 > comp.votes_user1) {
        winnerImage = comp.user2_image;
      }

      return {
        startDate: new Date(comp.Contest.contest_live_date).toISOString(),
        endDate: new Date(comp.Contest.voting_deadline).toISOString(),
        image: winnerImage, // ✅ Pulling winner's image
        username: comp.winner_username, // ✅ Directly from the competition
        theme: comp.Contest.Theme?.name || 'Unknown Theme', // ✅ Fetching from Theme model
        payout: parseFloat(comp.winner_earnings) || 0, // ✅ Ensure it's a number
        entries: comp.Contest.total_entries, // ✅ Pulling total entries from Contests table
      };
    });

    res.json({ success: true, winners: formattedWinners });
  } catch (error) {
    console.error('❌ Error fetching winners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching winners.',
    });
  }
};

exports.getLiveContests = async (req, res) => {
  try {
    const contest = await Contest.findOne({
      where: { status: 'Live' },
      include: [{ model: Theme, as: 'Theme', attributes: ['name'] }],
      order: [
        ['contest_live_date', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    if (!contest) {
      return res.json({ success: true, contest: null });
    }

    const competitions = await Competition.findAll({
      where: { contest_id: contest.id },
      include: [
        { model: User, as: 'User1', attributes: ['id', 'username'] },
        { model: User, as: 'User2', attributes: ['id', 'username'] },
      ],
    });

    const userMap = new Map();

    competitions.forEach((comp) => {
      const entries = [
        {
          id: comp.user1_id,
          username: comp.User1?.username || 'Unknown',
          imageUrl: comp.user1_image,
          margin: comp.votes_user1 - (comp.votes_user2 || 0),
        },
        comp.user2_id && comp.user2_image
          ? {
              id: comp.user2_id,
              username: comp.User2?.username || 'Unknown',
              imageUrl: comp.user2_image,
              margin: comp.votes_user2 - (comp.votes_user1 || 0),
            }
          : null,
      ].filter(Boolean);

      entries.forEach(({ id, username, imageUrl, margin }) => {
        if (!userMap.has(id)) {
          userMap.set(id, {
            id,
            username,
            totalMargin: 0,
            images: [],
            earnings: '0',
          });
        }

        const userEntry = userMap.get(id);
        userEntry.totalMargin += margin;
        userEntry.images.push({ imageUrl, margin });
      });
    });

    // Convert to array and sort by totalMargin
    const leaderboard = Array.from(userMap.values()).sort(
      (a, b) => b.totalMargin - a.totalMargin
    );

    // Assign earnings to top 3
    if (leaderboard[0]) leaderboard[0].earnings = `${contest.winnings.first}`;
    if (leaderboard[1]) leaderboard[1].earnings = `${contest.winnings.second}`;
    if (leaderboard[2]) leaderboard[2].earnings = `${contest.winnings.third}`;

    const userId = req.user?.id;
    const userSubmission = userId
      ? leaderboard.find((u) => u.id === userId)
      : null;

    return res.json({
      success: true,
      contest: {
        contestName: contest.Theme?.name || 'Unknown Contest',
        contestId: contest.id,
        entries: contest.total_entries,
        prizePool: `$${contest.prize_pool}`,
        winnings: contest.winnings,
        leaderboard,
        userSubmission,
        maxWinners: 3,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching live contests:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching live contests.',
    });
  }
};

// exports.getLiveContests = async (req, res) => {
//   try {
//       console.log("📢 Fetching live contests...");

//       const contest = await Contest.findOne({
//           where: { status: "Live" },
//           include: [{ model: Theme, as: "Theme", attributes: ["name"] }],
//           order: [["contest_live_date", "DESC"]],
//       });

//       if (!contest) {
//           return res.json({ success: true, contest: null });
//       }

//       const competitions = await Competition.findAll({
//           where: { contest_id: contest.id },
//           include: [
//               { model: User, as: "User1", attributes: ["id", "username"] },
//               { model: User, as: "User2", attributes: ["id", "username"] }
//           ]
//       });

//       let allEntries = [];

//       competitions.forEach((comp) => {
//           // User 1
//           allEntries.push({
//               id: comp.user1_id,
//               username: comp.User1?.username,
//               imageUrl: comp.user1_image,
//               votes: comp.votes_user1,
//               opponentVotes: comp.votes_user2 || 0,
//               margin: comp.votes_user1 - (comp.votes_user2 || 0),
//               earnings: "0"
//           });

//           // User 2
//           if (comp.user2_id) {
//               allEntries.push({
//                   id: comp.user2_id,
//                   username: comp.User2?.username,
//                   imageUrl: comp.user2_image,
//                   votes: comp.votes_user2,
//                   opponentVotes: comp.votes_user1 || 0,
//                   margin: comp.votes_user2 - (comp.votes_user1 || 0),
//                   earnings: "0"
//               });
//           }
//       });

//       // Sort by margin of victory
//       const leaderboard = allEntries.sort((a, b) => b.margin - a.margin);

//       // Assign earnings to top 3
//       if (leaderboard[0]) leaderboard[0].earnings = `${contest.winnings.first}`;
//       if (leaderboard[1]) leaderboard[1].earnings = `${contest.winnings.second}`;
//       if (leaderboard[2]) leaderboard[2].earnings = `${contest.winnings.third}`;

//       // Get user's entry, if logged in
//       const userId = req.user?.id;
//       let userSubmission = null;

//       if (userId) {
//           const match = leaderboard.find((entry) => entry.id === userId);
//           if (match) {
//               userSubmission = { ...match };
//           }
//       }

//       console.log("📊 Leaderboard calculated by margin of victory.");
//       res.json({
//           success: true,
//           contest: {
//               contestName: contest.Theme?.name || "Unknown Contest",
//               contestId: contest.id,
//               entries: contest.total_entries,
//               prizePool: `$${contest.prize_pool}`,
//               userSubmission,
//               leaderboard,
//               maxWinners: 3
//           }
//       });

//   } catch (error) {
//       console.error("❌ Error fetching live contests:", error);
//       res.status(500).json({ success: false, message: "Server error while fetching live contests." });
//   }
// };

exports.getOpponentInfo = async (req, res) => {
  try {
    const { userId, competitionId } = req.query;

    if (!userId || !competitionId) {
      return res
        .status(400)
        .json({ error: 'userId and competitionId are required.' });
    }

    const competition = await Competition.findByPk(competitionId, {
      include: [
        { model: User, as: 'User1', attributes: ['id', 'username'] },
        { model: User, as: 'User2', attributes: ['id', 'username'] },
      ],
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found.' });
    }

    let opponent = null;
    let currentUser = null;

    if (String(competition.user1_id) === String(userId)) {
      if (!competition.user2_id) {
        currentUser = {
          id: competition.User1?.id,
          username: competition.User1?.username,
          imageUrl: competition.user1_image || '',
          votes: competition.votes_user1 || 0,
        };
        return res.status(200).json({
          opponent: null,
          currentUser,
          matchType: competition.match_type,
          inviteLink: competition.invite_link || null,
          inviteUrl: competition.invite_url || null,
        });
      }
      opponent = {
        id: competition.User2?.id,
        username: competition.User2?.username,
        imageUrl: competition.user2_image,
        votes: competition.votes_user2,
      };
      currentUser = {
        id: competition.User1?.id,
        username: competition.User1?.username,
        imageUrl: competition.user1_image,
        votes: competition.votes_user1,
      };
    } else if (String(competition.user2_id) === String(userId)) {
      opponent = {
        id: competition.User1?.id,
        username: competition.User1?.username,
        imageUrl: competition.user1_image,
        votes: competition.votes_user1,
      };
      currentUser = {
        id: competition.User2?.id,
        username: competition.User2?.username,
        imageUrl: competition.user2_image,
        votes: competition.votes_user2,
      };
    } else {
      return res
        .status(403)
        .json({ error: 'User is not a participant in this competition.' });
    }

    res.status(200).json({
      opponent,
      currentUser,
      matchType: competition.match_type,
      inviteLink: competition.invite_link || null,
    });
  } catch (error) {
    console.error('❌ Error fetching opponent info:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Send the invitation to the same user or any other user
 * @routes (POST /reinvite-opponent)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.reinviteOpponent = async (req, res) => {
  try {
    const { email, competitionId, invitee_name, match_type } = req.body;
    let combinedLink;
    let joinedExistingMatch = false;

    const competition = await Competition.findOne({
      where: {
        id: competitionId,
        status: 'Waiting',
      },
    });

    if (!competition) {
      return res
        .status(404)
        .json({ error: 'Competition not found or already started.' });
    }

    if (match_type === 'pick_random') {
      const ongoingCompetition = await Competition.findOne({
        where: {
          contest_id: competition.contest_id,
          match_type: 'pick_random',
          user2_id: null,
          status: 'Waiting',
        },
        order: [['createdAt', 'ASC']],
      });

      if (ongoingCompetition) {
        ongoingCompetition.user2_id = competition.user1_id;
        ongoingCompetition.user2_image = competition.user1_image;
        ongoingCompetition.user2_join_date = new Date();
        ongoingCompetition.status = 'Active';
        await ongoingCompetition.save();
        joinedExistingMatch = true;

        await competition.destroy();

        return res.status(200).json({
          message: 'Competition Joined Successfully!',
          competition: ongoingCompetition,
          joinedExistingMatch,
        });
      }

      if (!ongoingCompetition && !competition.user2_id) {
        // update the match type
        competition.match_type = match_type;

        // set the invite friend values to null
        competition.invite_link = null;
        competition.invite_url = null;
        competition.invited_friend_email = null;
        competition.invited_friend_name = null;
        competition.invite_accepted = false;

        await competition.save();

        return res.status(200).json({
          message: 'Competition Updated Successfully!',
          competition: competition,
          joinedExistingMatch: false,
        });
      }
    } else {
      if (!email || !competitionId) {
        return res
          .status(400)
          .json({ error: 'Email and competitionId are required.' });
      }

      const inviteCode = crypto.randomBytes(6).toString('hex'); // e.g. "a1b2c3d4e5f6"
      competition.invite_link = inviteCode;

      if (email) {
        const findOpponent = await User.findOne({
          where: { email: email },
          attributes: ['id'],
        });

        if (findOpponent?.id === req?.user?.id) {
          return res
            .status(400)
            .json({ message: 'You cannot invite yourself in the game!' });
        }

        let queryString = `?invite_code=${inviteCode}`;

        // page L for Login page, R for Register page
        let inviteUrl = '';
        if (findOpponent) {
          inviteUrl = `${process.env.FRONTEND_URL}login`;
          // queryString += `&email=${email}&page=L`;
        } else {
          inviteUrl = `${process.env.FRONTEND_URL}signup`;
          // queryString += `&email=${email}&name=${invitee_name}&referralCode=${findUser.referral_code}&page=R`;
        }

        combinedLink = inviteUrl + queryString;

        await sendInviteEmail(email, req?.user?.username || '', combinedLink);
      }

      competition.invite_url = combinedLink || null;
      competition.invited_friend_email = email || null;
      competition.invited_friend_name = invitee_name || null;
      await competition.save();

      res.status(200).json({
        message: 'Invite link sent successfully.',
        inviteLink: competition.invite_link || null,
        inviteUrl: combinedLink || null,
      });
    }
  } catch (error) {
    console.error('❌ Error fetching opponent info:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
