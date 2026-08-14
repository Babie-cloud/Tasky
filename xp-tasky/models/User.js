const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  googleId: { type: String, default: null },
  facebookId: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  birthDate: { type: Date, default: null },
  bio: { type: String, default: '', maxlength: 280 },
  linkedIn: { type: String, default: '' },
  github: { type: String, default: '' },
  jobTitle: { type: String, default: '' },

  isSuperAdmin: { type: Boolean, default: false },

  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionPlan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'incomplete', null],
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);