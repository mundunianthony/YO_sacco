require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');

async function fixLoanIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get the loans collection
    const loansCollection = mongoose.connection.collection('loans');

    // Drop all indexes except _id
    console.log('Dropping existing indexes...');
    await loansCollection.dropIndexes();
    console.log('All indexes dropped');

    // Create new indexes
    console.log('Creating new indexes...');
    await loansCollection.createIndex({ loanNumber: 1 }, { unique: true });
    console.log('Created unique index on loanNumber');

    // Create a partial index on receiptNumber (only for non-null values)
    await loansCollection.createIndex(
      { 'paymentHistory.receiptNumber': 1 },
      { 
        unique: true,
        partialFilterExpression: { 'paymentHistory.receiptNumber': { $exists: true } }
      }
    );
    console.log('Created partial unique index on paymentHistory.receiptNumber');

    console.log('Index fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixLoanIndexes(); 