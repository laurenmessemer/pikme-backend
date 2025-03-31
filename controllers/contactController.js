const db = require("../db"); // adjust if you're using a different DB wrapper

const submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const query = `
      INSERT INTO contacts (name, email, message)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const values = [name, email, message];
    const result = await db.query(query, values);

    res.status(200).json({ success: true, contactId: result.rows[0].id });
  } catch (err) {
    console.error("Error saving contact form:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  submitContactForm,
};
