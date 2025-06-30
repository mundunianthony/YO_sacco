const mongoose = require('mongoose');
const User = require('../models/User');
const { TotalSavingsPool } = require('../models/Savings');
require('dotenv').config();

async function initializeSavingsPool() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Calculate total savings from all users
        const totalSavingsResult = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalSavings: { $sum: '$savingsBalance' }
                }
            }
        ]);

        const totalSavings = totalSavingsResult[0]?.totalSavings || 0;
        console.log(`Total savings from all users: UGX${totalSavings.toLocaleString()}`);

        // Get or create the total savings pool
        let totalSavingsPool = await TotalSavingsPool.findOne();

        if (!totalSavingsPool) {
            // Create new pool
            totalSavingsPool = await TotalSavingsPool.create({
                totalAmount: totalSavings,
                availableAmount: totalSavings,
                loanedAmount: 0
            });
            console.log('Created new total savings pool');
        } else {
            // Update existing pool
            totalSavingsPool.totalAmount = totalSavings;
            totalSavingsPool.availableAmount = totalSavings;
            totalSavingsPool.loanedAmount = 0;
            totalSavingsPool.lastUpdated = new Date();
            await totalSavingsPool.save();
            console.log('Updated existing total savings pool');
        }

        console.log('Savings pool initialized successfully:');
        console.log(`- Total Amount: UGX${totalSavingsPool.totalAmount.toLocaleString()}`);
        console.log(`- Available Amount: UGX${totalSavingsPool.availableAmount.toLocaleString()}`);
        console.log(`- Loaned Amount: UGX${totalSavingsPool.loanedAmount.toLocaleString()}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error initializing savings pool:', error);
        process.exit(1);
    }
}

// Run the script
initializeSavingsPool(); 