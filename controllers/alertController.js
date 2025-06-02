const { Alerts } = require('../models');

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
