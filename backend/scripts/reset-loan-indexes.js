require('dotenv').config();
const mongoose = require('mongoose');

const resetIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sacco');
    console.log('Connected to MongoDB');

    // Get the loans collection
    const db = mongoose.connection.db;
    const loansCollection = db.collection('loans');

    // Drop all indexes except _id
    await loansCollection.dropIndexes();
    console.log('Successfully dropped all indexes');

    // Create new indexes
    await loansCollection.createIndex({ loanNumber: 1 }, { unique: true });
    console.log('Created loanNumber index');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting indexes:', error);
    process.exit(1);
  }
};

resetIndexes(); 