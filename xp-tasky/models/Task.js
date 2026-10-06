const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  order: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);