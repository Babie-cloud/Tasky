const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  googleId: { type: String, default: null },
  facebookId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);