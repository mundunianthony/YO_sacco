const mongoose = require('mongoose');
const Loan = require('../models/Loan');
require('dotenv').config();

async function fixPaymentHistory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all loans with payment history
        const loans = await Loan.find({
            'paymentHistory.0': { $exists: true }
        });

        console.log(`Found ${loans.length} loans with payment history`);

        let updatedLoans = 0;
        let updatedPayments = 0;

        for (const loan of loans) {
            let needsUpdate = false;

            // Check each payment in the history
            for (let i = 0; i < loan.paymentHistory.length; i++) {
                const payment = loan.paymentHistory[i];

                // If remainingBalanceAfterPayment is missing, calculate it
                if (payment.remainingBalanceAfterPayment === undefined) {
                    console.log(`Fixing payment ${i} for loan ${loan.loanNumber || loan._id}`);

                    // Calculate the remaining balance after this payment
                    // We need to sum up all payments up to this point and subtract from totalPayment
                    let totalPaidUpToThisPoint = 0;
                    for (let j = 0; j <= i; j++) {
                        totalPaidUpToThisPoint += loan.paymentHistory[j].amount;
                    }

                    const remainingBalanceAfterThisPayment = Math.max(0, loan.totalPayment - totalPaidUpToThisPoint);

                    // Update the payment
                    loan.paymentHistory[i].remainingBalanceAfterPayment = remainingBalanceAfterThisPayment;
                    needsUpdate = true;
                    updatedPayments++;
                }
            }

            // Save the loan if any payments were updated
            if (needsUpdate) {
                await loan.save();
                updatedLoans++;
                console.log(`Updated loan ${loan.loanNumber || loan._id}`);
            }
        }

        console.log(`\nMigration completed:`);
        console.log(`- Updated ${updatedLoans} loans`);
        console.log(`- Fixed ${updatedPayments} payment entries`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
fixPaymentHistory(); 