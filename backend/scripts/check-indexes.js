require('dotenv').config();
const mongoose = require('mongoose');

const checkIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sacco');
    console.log('Connected to MongoDB');

    // Get the loans collection
    const db = mongoose.connection.db;
    const loansCollection = db.collection('loans');

    // Get all indexes
    const indexes = await loansCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error checking indexes:', error);
    process.exit(1);
  }
};

checkIndexes(); 