const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  उत्पादन_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  उत्पादन_नाव: String,
  प्रमाण: Number,
  एकक: String,
  मूळ_किंमत: Number,       // original selling price
  विक्री_किंमत: Number,    // actual price after discount
  सूट: { type: Number, default: 0 },  // discount per unit
  एकूण: Number
});

const billSchema = new mongoose.Schema({
  बिल_क्रमांक: { type: String, unique: true },
  ग्राहक_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  ग्राहक_नाव: String,
  बिल_दिनांक: { type: Date, default: Date.now },
  वस्तू: [billItemSchema],
  एकूण_रक्कम: Number,          // total bill amount
  सूट_एकूण: { type: Number, default: 0 },   // total discount
  अंतिम_रक्कम: Number,         // final amount after discount
  दिलेली_रक्कम: { type: Number, default: 0 },  // amount paid
  बाकी_रक्कम: { type: Number, default: 0 },    // remaining due
  देयक_स्थिती: {
    type: String,
    enum: ['पूर्ण_भरलेले', 'अंशतः_भरलेले', 'उधार'],
    default: 'उधार'
  },
  नोट: String,
  बिल_प्रकार: { type: String, default: 'विक्री' }
}, { timestamps: true });

// Auto-generate bill number
billSchema.pre('save', async function(next) {
  if (!this.बिल_क्रमांक) {
    const count = await mongoose.model('Bill').countDocuments();
    const d = new Date();
    this.बिल_क्रमांक = `SB-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
