const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    // null tant que l'invité ne s'est pas connecté / n'a pas de compte
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'member', 'observer'], default: 'member' },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
    inviteToken: { type: String, default: null },
    invitedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Mon tableau' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);