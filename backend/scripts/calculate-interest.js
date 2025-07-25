const mongoose = require('mongoose');
const InterestService = require('../services/interestService');
require('dotenv').config();

/**
 * Script to calculate and apply interest to all member accounts
 * Can be run manually or via cron job
 * 
 * Usage:
 * - node scripts/calculate-interest.js (for current month)
 * - node scripts/calculate-interest.js 2024 3 (for March 2024)
 * - node scripts/calculate-interest.js 2024 3 5.5 (for March 2024 with 5.5% rate)
 */

async function calculateInterest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Parse command line arguments
    const args = process.argv.slice(2);
    let year, month, interestRate;

    if (args.length >= 2) {
      year = parseInt(args[0]);
      month = parseInt(args[1]);
      interestRate = args[2] ? parseFloat(args[2]) : InterestService.DEFAULT_INTEREST_RATE;
    } else {
      // Default to current month
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1; // getMonth() returns 0-11
      interestRate = InterestService.DEFAULT_INTEREST_RATE;
    }

    // Validate inputs
    if (year < 2020 || year > 2030) {
      throw new Error('Invalid year. Must be between 2020 and 2030.');
    }
    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Must be between 1 and 12.');
    }
    if (interestRate < 0 || interestRate > 20) {
      throw new Error('Invalid interest rate. Must be between 0 and 20%.');
    }

    // Calculate date range
    const fromDate = new Date(year, month - 1, 1); // First day of month
    const toDate = new Date(year, month, 0); // Last day of month

    console.log(`\n=== Interest Calculation for ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()} ===`);
    console.log(`Interest Rate: ${interestRate}% per annum`);
    console.log('Starting calculation...\n');

    // Calculate and apply interest
    const result = await InterestService.calculateAndApplyInterestForAllUsers(
      fromDate,
      toDate,
      interestRate
    );

    // Display results
    console.log('\n=== Interest Calculation Results ===');
    console.log(`Total Users Processed: ${result.summary.totalUsers}`);
    console.log(`Successful Applications: ${result.summary.successfulApplications}`);
    console.log(`Failed Applications: ${result.summary.failedApplications}`);
    console.log(`Total Interest Applied: UGX${result.summary.totalInterestApplied.toLocaleString()}`);
    console.log(`Average Interest per User: UGX${Math.round(result.summary.totalInterestApplied / result.summary.successfulApplications).toLocaleString()}`);

    // Show top 5 interest earners
    if (result.results.length > 0) {
      console.log('\n=== Top 5 Interest Earners ===');
      const topEarners = result.results
        .filter(r => r.success)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      topEarners.forEach((earner, index) => {
        console.log(`${index + 1}. ${earner.userName}: UGX${earner.amount.toLocaleString()}`);
      });
    }

    // Show any errors
    const errors = result.results.filter(r => !r.success);
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(error => {
        console.log(`- ${error.userName}: ${error.error}`);
      });
    }

    console.log('\n=== Interest calculation completed successfully ===');
    process.exit(0);

  } catch (error) {
    console.error('Error calculating interest:', error);
    process.exit(1);
  }
}

// Run the script
calculateInterest(); 