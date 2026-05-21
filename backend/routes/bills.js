const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { महिना, वर्ष, स्थिती } = req.query;
    let filter = {};
    if (महिना && वर्ष) {
      const start = new Date(वर्ष, महिना - 1, 1);
      const end = new Date(वर्ष, महिना, 0, 23, 59, 59);
      filter.बिल_दिनांक = { $gte: start, $lte: end };
    }
    if (स्थिती) filter.देयक_स्थिती = स्थिती;
    
    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bill
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('ग्राहक_id');
    if (!bill) return res.status(404).json({ error: 'बिल सापडले नाही' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new bill
router.post('/', async (req, res) => {
  try {
    const { ग्राहक_id, ग्राहक_नाव, वस्तू, दिलेली_रक्कम, नोट } = req.body;

    // Calculate totals
    let एकूण_रक्कम = 0;
    let सूट_एकूण = 0;
    const processedItems = [];

    for (const item of वस्तू) {
      const product = await Product.findById(item.उत्पादन_id);
      if (!product) return res.status(400).json({ error: `उत्पादन सापडले नाही: ${item.उत्पादन_नाव}` });
      if (product.स्टॉक < item.प्रमाण) {
        return res.status(400).json({ error: `${product.नाव} साठी पुरेसा स्टॉक नाही. उपलब्ध: ${product.स्टॉक} ${product.एकक}` });
      }

      const मूळ_किंमत = product.विक्री_किंमत;
      const विक्री_किंमत = item.विक्री_किंमत || मूळ_किंमत;
      const सूट = (मूळ_किंमत - विक्री_किंमत) * item.प्रमाण;
      const एकूण = विक्री_किंमत * item.प्रमाण;

      processedItems.push({
        उत्पादन_id: item.उत्पादन_id,
        उत्पादन_नाव: product.नाव,
        प्रमाण: item.प्रमाण,
        एकक: product.एकक,
        मूळ_किंमत,
        विक्री_किंमत,
        सूट: मूळ_किंमत - विक्री_किंमत,
        एकूण
      });

      एकूण_रक्कम += मूळ_किंमत * item.प्रमाण;
      सूट_एकूण += सूट;

      // Deduct stock
      await Product.findByIdAndUpdate(item.उत्पादन_id, { $inc: { स्टॉक: -item.प्रमाण } });
    }

    const अंतिम_रक्कम = एकूण_रक्कम - सूट_एकूण;
    const paid = parseFloat(दिलेली_रक्कम) || 0;
    const बाकी_रक्कम = अंतिम_रक्कम - paid;

    let देयक_स्थिती = 'उधार';
    if (paid >= अंतिम_रक्कम) देयक_स्थिती = 'पूर्ण_भरलेले';
    else if (paid > 0) देयक_स्थिती = 'अंशतः_भरलेले';

    const bill = new Bill({
      ग्राहक_id,
      ग्राहक_नाव,
      वस्तू: processedItems,
      एकूण_रक्कम,
      सूट_एकूण,
      अंतिम_रक्कम,
      दिलेली_रक्कम: paid,
      बाकी_रक्कम,
      देयक_स्थिती,
      नोट
    });

    await bill.save();

    // Update customer udhar
    if (ग्राहक_id && बाकी_रक्कम > 0) {
      await Customer.findByIdAndUpdate(ग्राहक_id, { $inc: { एकूण_उधार: बाकी_रक्कम } });
    }

    // Record initial payment if any
    if (paid > 0 && ग्राहक_id) {
      await new Payment({
        ग्राहक_id,
        ग्राहक_नाव,
        बिल_id: bill._id,
        बिल_क्रमांक: bill.बिल_क्रमांक,
        रक्कम: paid,
        देयक_दिनांक: new Date(),
        नोट: 'बिल तयार करताना दिलेली रक्कम'
      }).save();
    }

    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update payment status on a bill (partial/full payment received)
router.patch('/:id/payment', async (req, res) => {
  try {
    const { रक्कम, नोट, देयक_दिनांक } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'बिल सापडले नाही' });

    const newPaid = bill.दिलेली_रक्कम + parseFloat(रक्कम);
    const newBaki = bill.अंतिम_रक्कम - newPaid;

    let देयक_स्थिती = 'अंशतः_भरलेले';
    if (newPaid >= bill.अंतिम_रक्कम) देयक_स्थिती = 'पूर्ण_भरलेले';

    await Bill.findByIdAndUpdate(req.params.id, {
      दिलेली_रक्कम: newPaid,
      बाकी_रक्कम: Math.max(0, newBaki),
      देयक_स्थिती
    });

    // Update customer udhar
    if (bill.ग्राहक_id) {
      await Customer.findByIdAndUpdate(bill.ग्राहक_id, { $inc: { एकूण_उधार: -parseFloat(रक्कम) } });
    }

    // Record payment
    await new Payment({
      ग्राहक_id: bill.ग्राहक_id,
      ग्राहक_नाव: bill.ग्राहक_नाव,
      बिल_id: bill._id,
      बिल_क्रमांक: bill.बिल_क्रमांक,
      रक्कम: parseFloat(रक्कम),
      देयक_दिनांक: देयक_दिनांक ? new Date(देयक_दिनांक) : new Date(),
      नोट: नोट || 'उधार परतफेड'
    }).save();

    const updatedBill = await Bill.findById(req.params.id);
    res.json(updatedBill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete bill (restore stock)
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'बिल सापडले नाही' });

    // Restore stock
    for (const item of bill.वस्तू) {
      await Product.findByIdAndUpdate(item.उत्पादन_id, { $inc: { स्टॉक: item.प्रमाण } });
    }

    // Fix customer udhar
    if (bill.ग्राहक_id && bill.बाकी_रक्कम > 0) {
      await Customer.findByIdAndUpdate(bill.ग्राहक_id, { $inc: { एकूण_उधार: -bill.बाकी_रक्कम } });
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'बिल काढले' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
