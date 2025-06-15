require('dotenv').config();
const mongoose = require('mongoose');

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sacco');
    console.log('Connected to MongoDB');

    // Get the loans collection
    const db = mongoose.connection.db;
    const loansCollection = db.collection('loans');

    // Drop the problematic index
    await loansCollection.dropIndex('repaymentHistory.receiptNumber_1');
    console.log('Successfully dropped the problematic index');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
};

fixIndex(); 