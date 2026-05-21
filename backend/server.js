const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb+srv://mayur:Mayur123@cluster0.3h3text.mongodb.net/shetkari_billing?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB शी यशस्वी जोडणी झाली'))
  .catch(err => console.error('❌ MongoDB जोडणी अयशस्वी:', err));

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 सर्व्हर चालू आहे: http://localhost:${PORT}`);
  console.log(`📦 शेतकरी बिलिंग सिस्टम तयार`);
});
