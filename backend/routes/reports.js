const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Monthly Report
// Logic: 
// - विक्री = bills created THIS month
// - वसूल झालेले = payments RECEIVED this month (regardless of when bill was created)
// - उधार बाकी = total outstanding across all customers
// - खर्च = expenses THIS month
// - नफा = (payments received this month) - (cost of goods sold this month) - (expenses this month)
router.get('/monthly', async (req, res) => {
  try {
    const महिना = parseInt(req.query.महिना) || new Date().getMonth() + 1;
    const वर्ष = parseInt(req.query.वर्ष) || new Date().getFullYear();

    const start = new Date(वर्ष, महिना - 1, 1);
    const end = new Date(वर्ष, महिना, 0, 23, 59, 59);

    // Bills created this month
    const bills = await Bill.find({ बिल_दिनांक: { $gte: start, $lte: end } });
    const एकूण_विक्री = bills.reduce((s, b) => s + b.अंतिम_रक्कम, 0);
    const एकूण_सूट = bills.reduce((s, b) => s + b.सूट_एकूण, 0);

    // Cost of goods sold this month (for profit calc)
    let खरेदी_किंमत_एकूण = 0;
    for (const bill of bills) {
      for (const item of bill.वस्तू) {
        const prod = await Product.findById(item.उत्पादन_id);
        if (prod) खरेदी_किंमत_एकूण += prod.खरेदी_किंमत * item.प्रमाण;
      }
    }

    // Payments received this month (cash inflow)
    const payments = await Payment.find({ महिना, वर्ष });
    const वसूल_झालेले = payments.reduce((s, p) => s + p.रक्कम, 0);

    // Expenses this month
    const expenses = await Expense.find({ महिना, वर्ष });
    const एकूण_खर्च = expenses.reduce((s, e) => s + e.रक्कम, 0);

    // Total pending udhar (all time)
    const allPendingBills = await Bill.find({ देयक_स्थिती: { $in: ['उधार', 'अंशतः_भरलेले'] } });
    const एकूण_उधार_बाकी = allPendingBills.reduce((s, b) => s + b.बाकी_रक्कम, 0);

    // Net profit = revenue from goods sold - cost - expenses
    const gross_profit = एकूण_विक्री - खरेदी_किंमत_एकूण;
    const निव्वळ_नफा = gross_profit - एकूण_खर्च;

    // Bill status breakdown
    const पूर्ण_भरलेले = bills.filter(b => b.देयक_स्थिती === 'पूर्ण_भरलेले').length;
    const अंशतः_भरलेले = bills.filter(b => b.देयक_स्थिती === 'अंशतः_भरलेले').length;
    const उधार = bills.filter(b => b.देयक_स्थिती === 'उधार').length;

    // Expected income = pending bills amount
    const अपेक्षित_उत्पन्न = allPendingBills.reduce((s, b) => s + b.बाकी_रक्कम, 0);

    // Top customers this month
    const customerSales = {};
    for (const bill of bills) {
      const key = bill.ग्राहक_नाव || 'अज्ञात';
      customerSales[key] = (customerSales[key] || 0) + bill.अंतिम_रक्कम;
    }

    res.json({
      महिना,
      वर्ष,
      एकूण_विक्री,
      एकूण_सूट,
      वसूल_झालेले,
      एकूण_खर्च,
      खरेदी_किंमत_एकूण,
      gross_profit,
      निव्वळ_नफा,
      एकूण_उधार_बाकी,
      अपेक्षित_उत्पन्न,
      एकूण_बिले: bills.length,
      बिल_स्थिती: { पूर्ण_भरलेले, अंशतः_भरलेले, उधार },
      खर्च_तपशील: expenses,
      payments_तपशील: payments,
      customerSales
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const महिना = now.getMonth() + 1;
    const वर्ष = now.getFullYear();
    const start = new Date(वर्ष, महिना - 1, 1);
    const end = new Date(वर्ष, महिना, 0, 23, 59, 59);

    const [totalCustomers, totalProducts, monthBills, pendingBills, lowStock] = await Promise.all([
      Customer.countDocuments(),
      Product.countDocuments(),
      Bill.find({ बिल_दिनांक: { $gte: start, $lte: end } }),
      Bill.find({ देयक_स्थिती: { $in: ['उधार', 'अंशतः_भरलेले'] } }),
      Product.find({ $expr: { $lte: ['$स्टॉक', '$किमान_स्टॉक'] } })
    ]);

    const monthRevenue = monthBills.reduce((s, b) => s + b.अंतिम_रक्कम, 0);
    const monthCollected = monthBills.reduce((s, b) => s + b.दिलेली_रक्कम, 0);
    const totalPending = pendingBills.reduce((s, b) => s + b.बाकी_रक्कम, 0);

    res.json({
      एकूण_ग्राहक: totalCustomers,
      एकूण_उत्पादने: totalProducts,
      या_महिन्याची_विक्री: monthRevenue,
      या_महिन्याचे_वसूल: monthCollected,
      एकूण_उधार: totalPending,
      कमी_स्टॉक: lowStock.length,
      कमी_स्टॉक_उत्पादने: lowStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
