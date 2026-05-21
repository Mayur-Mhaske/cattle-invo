const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ नाव: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ $expr: { $lte: ['$स्टॉक', '$किमान_स्टॉक'] } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'उत्पादन सापडले नाही' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add stock (warehouse in)
router.patch('/:id/stock-add', async (req, res) => {
  try {
    const { प्रमाण } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { स्टॉक: प्रमाण } },
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'उत्पादन काढले' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
