const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, default: '#2eb85c' },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);