const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    order: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);