const { Alerts } = require('../models');

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description List all the Alerts
 * @routes (GET /determine-winners)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const listAllAlerts = async (req, res) => {
  try {
    const getListAlerts = await Alerts.findAll({
      where: {
        user_id: req.user.id,
        is_deleted: false,
      },
      order: [['createdAt', 'DESC']],
    });

    // ✅ Return response
    res.status(201).json({
      message: 'List of Alerts!',
      alerts: getListAlerts,
    });
  } catch (err) {
    console.error('❌ listAllAlerts Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Read the Alert
 * @routes (PUT /:alert_id)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const readAlert = async (req, res) => {
  try {
    const { alert_id } = req.params;

    if (!alert_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const alert = await Alerts.findOne({
      where: { user_id: req.user.id, id: alert_id },
    });

    alert.is_seen = true;

    alert.save();
    // ✅ Return response
    res.status(201).json({
      message: 'Alert Read!',
      alerts: alert,
    });
  } catch (err) {
    console.error('❌ Alert Read Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Delete Alert
 * @routes (DELETE /:alert_id)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const deleteAlert = async (req, res) => {
  try {
    const { alert_id } = req.params;

    if (!alert_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const alert = await Alerts.findOne({
      where: { user_id: req.user.id, id: alert_id },
    });

    alert.is_deleted = true;

    alert.save();
    // ✅ Return response
    res.status(201).json({
      message: 'Alert Deleted!',
    });
  } catch (err) {
    console.error('❌ Alert Read Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  listAllAlerts,
  readAlert,
  deleteAlert,
};
