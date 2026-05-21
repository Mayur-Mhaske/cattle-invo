const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ग्राहक_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  ग्राहक_नाव: String,
  बिल_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
  बिल_क्रमांक: String,
  रक्कम: { type: Number, required: true },
  देयक_दिनांक: { type: Date, default: Date.now },
  देयक_पद्धत: { type: String, default: 'रोख' }, // cash/upi/cheque
  नोट: String,
  // which month this payment was RECEIVED (for monthly report)
  महिना: Number,
  वर्ष: Number
}, { timestamps: true });

paymentSchema.pre('save', function(next) {
  const d = this.देयक_दिनांक || new Date();
  this.महिना = d.getMonth() + 1;
  this.वर्ष = d.getFullYear();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
