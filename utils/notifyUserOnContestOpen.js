const { User } = require('../models');
const addAlerts = require('./addAlerts');

/**
 * Notify the all the user's on Contest got Live
 * @author Dhrumil Amrutiya (Zignuts)
 */
async function notifyUserOnContestOpen(data) {
  try {
    const findUsers = await User.findAll();

    for (let i = 0; i < findUsers.length; i++) {
      const user = findUsers[i];

      await addAlerts({
        user_id: user.id,
        title: 'A New Contest Just Dropped!',
        message: `Join now and put your skills to the test. Don't miss the chance to compete and win big!`,
      });
    }

    return {
      isError: false,
    };
  } catch (error) {
    console.error('Error adding:', error.message);
    return {
      isError: true,
      error: error.message,
    };
  }
}

module.exports = notifyUserOnContestOpen;
