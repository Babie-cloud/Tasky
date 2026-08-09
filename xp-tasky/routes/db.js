const mongoose = require('mongoose');
let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/xp-tasky';
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB connecté avec succès');
};

module.exports = connectDB;