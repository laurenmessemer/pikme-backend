const { Alerts } = require('../models');

/**
 * Add the Alert in the DB
 * @author Dhrumil Amrutiya (Zignuts)
 */
async function addAlerts(data) {
  try {
    const { user_id, message, title } = data;

    const createData = await Alerts.create({
      user_id,
      message,
      title,
    });

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

module.exports = addAlerts;
