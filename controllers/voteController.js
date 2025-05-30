const { Competition, Contest, Theme, Vote } = require('../models');
const { Op, Sequelize } = require('sequelize');

// ✅ Fetch active competitions where both images exist
exports.getVotingEntries = async (req, res) => {
  try {
    const { userId } = req.query;
    const competitions = await Competition.findAll({
      where: {
        status: 'Active',
        user1_image: { [Op.not]: null },
        user2_image: { [Op.not]: null },
        // Subquery to exclude competitions the user has voted in
        ...(userId && {
          [Op.and]: Sequelize.literal(`"Competition"."id" NOT IN (
            SELECT "competition_id"
            FROM "Votes"
            WHERE "voter_id" = ${userId}
          )`),
        }),
      },
      include: [
        {
          model: Contest,
          where: {
            status: 'Live',
            voting_deadline: {
              [Op.gt]: new Date(),
            },
            voting_live_date: {
              [Op.lt]: new Date(),
            },
          },
          include: [{ model: Theme, as: 'Theme' }],
        },
      ],
      order: [Sequelize.literal('RANDOM()')],
      limit: 5,
    });

    if (!competitions || competitions.length === 0) {
      return res.status(200).json({
        competitions: [],
        message: 'No more competitions left to vote on.',
      });
    }

    const formatted = competitions.map((comp) => ({
      id: comp.id,
      user1_image: comp.user1_image,
      user2_image: comp.user2_image,
      votes_user1: comp.votes_user1, // ✅ add this
      votes_user2: comp.votes_user2, // ✅ add this
      contestId: comp.Contest.id,
      entry_fee: comp.Contest.entry_fee,
      prize_pool: parseFloat(comp.Contest.prize_pool),
      theme_name: comp.Contest.Theme?.name || 'Theme',
      theme_description: comp.Contest.Theme?.description || '',
      cover_image: comp.Contest.Theme?.cover_image_url || '',
    }));

    res.status(200).json({ competitions: formatted });
  } catch (error) {
    console.error('❌ Error fetching competitions:', error);
    res
      .status(500)
      .json({ message: 'Error fetching competitions', error: error.message });
  }
};

// ✅ Cast vote
exports.castVote = async (req, res) => {
  const { competitionId, selectedImage, voterId } = req.body;

  if (!competitionId || !selectedImage) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const dbVoterId = parseInt(voterId);
  const isAnon = dbVoterId === 99999;

  try {
    const competition = await Competition.findByPk(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // ✅ Only check for duplicates if voter is logged in
    if (!isAnon && dbVoterId) {
      const existingVote = await Vote.findOne({
        where: {
          voter_id: dbVoterId,
          competition_id: competitionId,
        },
      });

      if (existingVote) {
        return res
          .status(400)
          .json({ message: 'You have already voted in this competition' });
      }
    }

    // ✅ Validate selected image
    let voted_for = null;
    if (selectedImage === competition.user1_image) {
      voted_for = 'user1';
      competition.votes_user1 += 1;
    } else if (selectedImage === competition.user2_image) {
      voted_for = 'user2';
      competition.votes_user2 += 1;
    } else {
      return res.status(400).json({ message: 'Invalid image selected' });
    }

    // ✅ Record vote, use `null` for anonymous
    await Vote.create({
      voter_id: dbVoterId || null,
      competition_id: competitionId,
      voted_for,
    });

    await competition.save();

    return res.status(200).json({
      message: isAnon
        ? 'Anonymous vote recorded (limited to 3 max).'
        : 'Vote recorded successfully',
      votes_user1: competition.votes_user1,
      votes_user2: competition.votes_user2,
    });
  } catch (error) {
    console.error('❌ Error casting vote:', error);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
