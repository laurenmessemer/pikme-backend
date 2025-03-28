const { Competition, Contest, Theme, User } = require("../models");
const { Op } = require("sequelize");

exports.getUserSubmissions = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        // ✅ Fetch competitions where the user is user1 or user2
        const competitions = await Competition.findAll({
            where: {
                [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
            },
            include: [
                {
                  model: Contest,
                  attributes: ["status"],
                  include: [
                    {
                      model: Theme,
                      as: "Theme",
                      attributes: ["name"],
                    },
                  ],
                },
                {
                  model: User,
                  as: "User1",
                  attributes: ["id", "username"],
                },
                {
                  model: User,
                  as: "User2",
                  attributes: ["id", "username"],
                },
              ],              
            order: [["createdAt", "DESC"]],
        });

        // ✅ Format response
        const formattedSubmissions = competitions.map((comp) => ({
            id: comp.id,
            image: comp.user1_id === parseInt(userId) ? comp.user1_image : comp.user2_image,
            username:
                comp.user1_id === parseInt(userId)
                    ? comp.User1?.username || "Me"
                    : comp.User2?.username || "Me",
            theme: comp.Contest?.Theme?.name || "Unknown Theme", // ✅ Fetch theme name correctly
            contestStatus: comp.Contest.status, // ✅ Fetch contest status from Contest
            position: "N/A", // ✅ Update if needed
            payout: "0", // ✅ Update if payouts are tracked
        }));

        return res.json({ success: true, submissions: formattedSubmissions });
    } catch (error) {
        console.error("Error fetching user submissions:", error);
        res.status(500).json({ error: "Server error while fetching submissions." });
    }
};

exports.getWinners = async (req, res) => {
    try {
        console.log("📢 Fetching winners from the database...");

        const winners = await Competition.findAll({
            where: { status: "Complete" },  // ✅ Only fetch completed competitions
            include: [
                {
                    model: Contest,
                    attributes: ["id", "theme_id", "entry_fee", "voting_deadline", "contest_live_date", "total_entries"],
                    include: [
                        {
                            model: Theme, 
                            as: "Theme",  // ✅ Ensure correct alias matching in the query
                            attributes: ["name"], // ✅ Fetch the theme name
                        },
                    ],
                },
            ],
            order: [["updatedAt", "DESC"]],
        });

        if (!winners || winners.length === 0) {
            return res.json({ success: true, winners: [] });
        }

        // ✅ Map and structure the winners data
        const formattedWinners = winners.map((comp) => {
            // Determine winner based on vote counts
            let winnerImage = "https://photo-contest-storage.s3.us-east-2.amazonaws.com/uploads/default.jpg"; // Default placeholder
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
                theme: comp.Contest.Theme?.name || "Unknown Theme", // ✅ Fetching from Theme model
                payout: parseFloat(comp.winner_earnings) || 0, // ✅ Ensure it's a number
                entries: comp.Contest.total_entries, // ✅ Pulling total entries from Contests table
            };
        });

        console.log("🏆 Winners successfully fetched:", formattedWinners);
        res.json({ success: true, winners: formattedWinners });

    } catch (error) {
        console.error("❌ Error fetching winners:", error);
        res.status(500).json({ success: false, message: "Server error while fetching winners." });
    }
};

exports.getLiveContests = async (req, res) => {
    try {
        console.log("📢 Fetching live contests...");

        // Fetch the most recent live contest
        const contest = await Contest.findOne({
            where: { status: "Live" },
            include: [{ model: Theme, as: "Theme", attributes: ["name"] }],
            order: [["contest_live_date", "DESC"]],
        });

        if (!contest) {
            return res.json({ success: true, contest: null });
        }

        // Fetch all competition entries for the contest
        const competitions = await Competition.findAll({
            where: { contest_id: contest.id },
            include: [
                { model: User, as: "User1", attributes: ["id", "username"] },
                { model: User, as: "User2", attributes: ["id", "username"] }
            ]
        });

        let leaderboard = [];
        let userSubmission = null;
        let allEntries = [];

        competitions.forEach((comp) => {
          // Add User 1's entry
          allEntries.push({
            id: comp.user1_id,
            username: comp.User1?.username,
            imageUrl: comp.user1_image,
            votes: comp.votes_user1,
            earnings: "$0"
          });
        
          // Add User 2's entry (if exists)
          if (comp.user2_id) {
            allEntries.push({
              id: comp.user2_id,
              username: comp.User2?.username,
              imageUrl: comp.user2_image,
              votes: comp.votes_user2,
              earnings: "$0"
            });
          }
        });
        
        // Sort by votes and get the top 3
        leaderboard = allEntries.sort((a, b) => b.votes - a.votes);

        // Assign earnings from "winnings" column in Contest
        if (leaderboard.length > 0) leaderboard[0].earnings = `$${contest.winnings.first}`;
        if (leaderboard.length > 1) leaderboard[1].earnings = `$${contest.winnings.second}`;
        if (leaderboard.length > 2) leaderboard[2].earnings = `$${contest.winnings.third}`;

        // Get logged-in user's submission (if available)
        const userId = req.user?.id; // Ensure authentication middleware is applied
        if (userId) {
            const userEntry = allEntries.find((entry) => entry.id === userId);
            if (userEntry) {
                userSubmission = {
                    ...userEntry,
                    earnings: leaderboard.find((entry) => entry.id === userId)?.earnings || "$0"
                };
            }
        }

        console.log("🏆 Live contest data fetched successfully.");
        res.json({
            success: true,
            contest: {
                contestName: contest.Theme?.name || "Unknown Contest",
                contestId: contest.id,
                entries: contest.total_entries,
                prizePool: `$${contest.prize_pool}`,
                userSubmission,
                leaderboard,
                maxWinners: 3
            }
        });

    } catch (error) {
        console.error("❌ Error fetching live contests:", error);
        res.status(500).json({ success: false, message: "Server error while fetching live contests." });
    }
};

exports.getOpponentInfo = async (req, res) => {
    try {
      const { userId, competitionId } = req.query;
  
      if (!userId || !competitionId) {
        return res.status(400).json({ error: "userId and competitionId are required." });
      }
  
      const competition = await Competition.findByPk(competitionId, {
        include: [
          { model: User, as: "User1", attributes: ["id", "username"] },
          { model: User, as: "User2", attributes: ["id", "username"] }
        ]
      });
  
      if (!competition) {
        return res.status(404).json({ error: "Competition not found." });
      }
  
      let opponent = null;
  
      if (String(competition.user1_id) === String(userId)) {
        if (!competition.user2_id) {
          return res.status(200).json({
            opponent: null,
            matchType: competition.match_type,
            inviteLink: competition.invite_link || null
          });
        }
        opponent = {
          id: competition.User2?.id,
          username: competition.User2?.username,
          imageUrl: competition.user2_image,
          votes: competition.votes_user2
        };
      } else if (String(competition.user2_id) === String(userId)) {
        opponent = {
          id: competition.User1?.id,
          username: competition.User1?.username,
          imageUrl: competition.user1_image,
          votes: competition.votes_user1
        };
      } else {
        return res.status(403).json({ error: "User is not a participant in this competition." });
      }
  
      res.status(200).json({
        opponent,
        matchType: competition.match_type,
        inviteLink: competition.invite_link || null
      });
  
    } catch (error) {
      console.error("❌ Error fetching opponent info:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
  