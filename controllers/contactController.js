const { Contact } = require('../models');

// ✅ Submit a contact form
const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      console.warn('⚠️ Missing contact form fields');
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required.' });
    }

    // Create the contact record
    const newContact = await Contact.create({ name, email, message });

    res.status(201).json({ success: true, contactId: newContact.id });
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 🔧 (Optional) Get all contact messages – useful for admin dashboard
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(contacts);
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts, // optional export for admin UI later
};
