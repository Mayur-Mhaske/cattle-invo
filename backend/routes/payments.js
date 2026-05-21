const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { महिना, वर्ष, ग्राहक_id } = req.query;
    let filter = {};
    if (महिना) filter.महिना = parseInt(महिना);
    if (वर्ष) filter.वर्ष = parseInt(वर्ष);
    if (ग्राहक_id) filter.ग्राहक_id = ग्राहक_id;
    
    const payments = await Payment.find(filter).sort({ देयक_दिनांक: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
