const { Competition, User, Contest, Theme, Wallet } = require('../models');
const determineWinnersFunction = require('../utils/determineWinners');

// ✅ Fetch all competitions for admin (with Theme data)
exports.getAllCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          attributes: ['id', 'status', 'entry_fee', 'theme_id'],
          include: [
            {
              model: Theme,
              as: 'Theme',
              attributes: ['id', 'name', 'cover_image_url'],
            },
          ],
        },
        { model: User, as: 'User1', attributes: ['id', 'username'] },
        { model: User, as: 'User2', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(competitions);
  } catch (error) {
    console.error('❌ Error fetching competitions:', error);
    res
      .status(500)
      .json({ error: 'Server error while fetching competitions.' });
  }
};

// ✅ Determine winners manually
exports.determineWinners = async (req, res) => {
  try {
    const now = new Date();
    const competitions = await Competition.findAll({
      include: [
        {
          model: Contest,
          attributes: ['entry_fee', 'voting_deadline'],
        },
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

        let winnerId = null;
        let looserName = null;
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
        }

        if (winnerUsername) {
          await competition.update({
            winner_username: winnerUsername,
            winner_earnings: winnerEarnings,
            status: 'Complete',
          });

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
          }

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

exports.determineWinnersV2 = async (req, res) => {
  try {
    const response = await determineWinnersFunction();

    if (response.success) {
      return res.json({
        success: true,
        message: response.message,
      });
    } else {
      return res
        .status(500)
        .json({ error: response.error, message: response.message });
    }
  } catch (error) {
    console.error('❌ Error determining winners:', error);
    return res
      .status(500)
      .json({ error: 'Server error while determining winners.' });
  }
};

exports.updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const competition = await Competition.findByPk(id);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    await competition.update(updates);
    res.json({ success: true, competition });
  } catch (error) {
    console.error('❌ Error updating competition:', error);
    res.status(500).json({ error: 'Server error while updating competition.' });
  }
};

exports.deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByPk(id);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    await competition.destroy();
    res.json({ success: true, message: `Competition ${id} deleted.` });
  } catch (error) {
    console.error('❌ Error deleting competition:', error);
    res.status(500).json({ error: 'Server error while deleting competition.' });
  }
};
