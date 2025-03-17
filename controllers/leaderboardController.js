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
                            as: "Theme",  // ✅ Ensures correct alias matching in the query
                            attributes: ["name"], // ✅ Fetch the theme name
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        // ✅ Format response
        const formattedSubmissions = competitions.map((comp) => ({
            id: comp.id,
            image: comp.user1_id === parseInt(userId) ? comp.user1_image : comp.user2_image,
            username: "Unknown", // ✅ Update if usernames are stored
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
            const isUser1 = comp.votes_user1 >= comp.votes_user2;
            const winner = {
                id: isUser1 ? comp.user1_id : comp.user2_id,
                username: isUser1 ? comp.User1?.username : comp.User2?.username,
                imageUrl: isUser1 ? comp.user1_image : comp.user2_image,
                votes: isUser1 ? comp.votes_user1 : comp.votes_user2,
                earnings: "$0"
            };

            allEntries.push(winner);
        });

        // Sort by votes and get the top 3
        leaderboard = allEntries.sort((a, b) => b.votes - a.votes).slice(0, 3);

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
