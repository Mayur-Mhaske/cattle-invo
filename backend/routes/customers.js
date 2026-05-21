const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer with history
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'ग्राहक सापडला नाही' });
    
    const bills = await Bill.find({ ग्राहक_id: req.params.id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ ग्राहक_id: req.params.id }).sort({ createdAt: -1 });
    
    res.json({ customer, bills, payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'ग्राहक काढला' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
