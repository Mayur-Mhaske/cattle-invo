const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  नाव: { type: String, required: true },
  फोन: { type: String },
  पत्ता: { type: String },
  एकूण_उधार: { type: Number, default: 0 },
  नोंदणी_दिनांक: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
