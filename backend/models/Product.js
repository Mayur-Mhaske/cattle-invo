const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  नाव: { type: String, required: true },
  श्रेणी: { type: String, default: 'जनावरांचे खाद्य' },
  खरेदी_किंमत: { type: Number, required: true },
  विक्री_किंमत: { type: Number, required: true },
  स्टॉक: { type: Number, default: 0 },
  एकक: { type: String, default: 'किलो' }, // kg, bag, litre etc
  किमान_स्टॉक: { type: Number, default: 10 }, // low stock alert threshold
  बारकोड: { type: String },
  नोट: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
