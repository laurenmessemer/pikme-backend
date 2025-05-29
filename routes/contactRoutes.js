const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const isUserMiddleware = require('../middleware/isUserMiddleware');

router.post('/contact', isUserMiddleware, submitContactForm);

module.exports = router;
