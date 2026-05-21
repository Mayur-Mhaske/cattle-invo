const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  शीर्षक: { type: String, required: true },
  श्रेणी: {
    type: String,
    enum: ['कामगार_वेतन', 'गोदाम_भाडे', 'वाहतूक', 'वीज_बिल', 'इतर'],
    default: 'इतर'
  },
  रक्कम: { type: Number, required: true },
  दिनांक: { type: Date, default: Date.now },
  व्यक्ती_नाव: String,  // worker name if applicable
  नोट: String,
  महिना: Number,
  वर्ष: Number
}, { timestamps: true });

expenseSchema.pre('save', function(next) {
  const d = this.दिनांक || new Date();
  this.महिना = d.getMonth() + 1;
  this.वर्ष = d.getFullYear();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
