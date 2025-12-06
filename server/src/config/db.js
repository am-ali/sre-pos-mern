const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('Missing Mongo connection string');
  }
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDB };
