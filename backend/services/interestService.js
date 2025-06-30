const User = require('../models/User');
const Transaction = require('../models/Transaction');
const NotificationService = require('./notificationService');

class InterestService {
    // Default interest rate (5% per annum)
    static DEFAULT_INTEREST_RATE = 5;

    /**
     * Calculate interest for a user's savings balance
     * @param {Object} user - User object with savings balance
     * @param {Date} fromDate - Start date for interest calculation
     * @param {Date} toDate - End date for interest calculation
     * @param {number} interestRate - Annual interest rate (default: 5%)
     * @returns {number} Calculated interest amount
     */
    static calculateInterest(user, fromDate, toDate, interestRate = this.DEFAULT_INTEREST_RATE) {
        const balance = user.savingsBalance || 0;
        if (balance <= 0) return 0;

        // Calculate days between dates
        const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 0) return 0;

        // Calculate daily interest rate (annual rate / 365 days)
        const dailyRate = interestRate / 365 / 100;

        // Calculate interest using simple interest formula
        const interest = balance * dailyRate * daysDiff;

        return Math.round(interest); // Round to nearest whole number
    }

    /**
     * Apply interest to a user's account
     * @param {string} userId - User ID
     * @param {number} interestAmount - Interest amount to apply
     * @param {Date} interestDate - Date for interest application
     * @param {string} period - Interest period description
     * @returns {Object} Result of interest application
     */
    static async applyInterest(userId, interestAmount, interestDate = new Date(), period = 'Monthly Interest') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (interestAmount <= 0) {
                return { success: true, message: 'No interest to apply', amount: 0 };
            }

            // Calculate new balance
            const oldBalance = user.savingsBalance || 0;
            const newBalance = oldBalance + interestAmount;

            // Create interest transaction
            const transaction = await Transaction.create({
                user: userId,
                type: 'interest_earned',
                amount: interestAmount,
                description: `${period} - ${interestAmount.toLocaleString()} UGX`,
                status: 'completed',
                category: 'interest',
                paymentMethod: 'system',
                balanceAfter: newBalance,
                receiptNumber: `INT${Date.now()}${Math.floor(Math.random() * 1000)}`,
                notes: `Interest applied for period ending ${interestDate.toLocaleDateString()}`
            });

            // Update user's savings balance
            user.savingsBalance = newBalance;
            await user.save();

            // Create notification for user
            try {
                await NotificationService.createNotification({
                    type: 'interest_earned',
                    message: `Interest of UGX${interestAmount.toLocaleString()} has been added to your savings account.`,
                    user: userId,
                    relatedTo: transaction._id,
                    onModel: 'Transaction',
                    priority: 'medium',
                    category: 'savings'
                });
            } catch (notificationError) {
                console.error('Error creating interest notification:', notificationError);
            }

            return {
                success: true,
                amount: interestAmount,
                oldBalance,
                newBalance,
                transaction: transaction._id
            };
        } catch (error) {
            console.error('Error applying interest:', error);
            throw error;
        }
    }

    /**
     * Calculate and apply interest for all users
     * @param {Date} fromDate - Start date for interest calculation
     * @param {Date} toDate - End date for interest calculation
     * @param {number} interestRate - Annual interest rate
     * @returns {Object} Summary of interest application
     */
    static async calculateAndApplyInterestForAllUsers(fromDate, toDate, interestRate = this.DEFAULT_INTEREST_RATE) {
        try {
            const users = await User.find({ role: 'member', status: 'active' });
            let totalInterestApplied = 0;
            let successfulApplications = 0;
            let failedApplications = 0;
            const results = [];

            for (const user of users) {
                try {
                    const interestAmount = this.calculateInterest(user, fromDate, toDate, interestRate);

                    if (interestAmount > 0) {
                        const result = await this.applyInterest(
                            user._id,
                            interestAmount,
                            toDate,
                            `Interest for ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`
                        );

                        if (result.success) {
                            totalInterestApplied += interestAmount;
                            successfulApplications++;
                            results.push({
                                userId: user._id,
                                userName: `${user.firstName} ${user.lastName}`,
                                amount: interestAmount,
                                success: true
                            });
                        }
                    }
                } catch (error) {
                    failedApplications++;
                    results.push({
                        userId: user._id,
                        userName: `${user.firstName} ${user.lastName}`,
                        error: error.message,
                        success: false
                    });
                    console.error(`Error applying interest for user ${user._id}:`, error);
                }
            }

            return {
                success: true,
                summary: {
                    totalUsers: users.length,
                    successfulApplications,
                    failedApplications,
                    totalInterestApplied
                },
                results
            };
        } catch (error) {
            console.error('Error in bulk interest calculation:', error);
            throw error;
        }
    }

    /**
     * Get interest summary for a user
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date for summary
     * @param {Date} endDate - End date for summary
     * @returns {Object} Interest summary
     */
    static async getUserInterestSummary(userId, startDate, endDate) {
        try {
            const transactions = await Transaction.find({
                user: userId,
                type: 'interest_earned',
                createdAt: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: -1 });

            const totalInterest = transactions.reduce((sum, t) => sum + t.amount, 0);
            const averageBalance = await this.calculateAverageBalance(userId, startDate, endDate);

            return {
                totalInterest,
                transactionCount: transactions.length,
                averageBalance,
                transactions
            };
        } catch (error) {
            console.error('Error getting user interest summary:', error);
            throw error;
        }
    }

    /**
     * Calculate average balance for a user over a period
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Average balance
     */
    static async calculateAverageBalance(userId, startDate, endDate) {
        try {
            // Get all transactions that affect balance in the period
            const transactions = await Transaction.find({
                user: userId,
                type: { $in: ['deposit', 'withdrawal', 'interest_earned'] },
                createdAt: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: 1 });

            let currentBalance = 0;
            let totalDays = 0;
            let balanceDays = 0;

            // Calculate daily balances
            const dailyBalances = [];
            let currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                // Find transactions for this date
                const dayTransactions = transactions.filter(t =>
                    t.createdAt.toDateString() === currentDate.toDateString()
                );

                // Apply transactions for this day
                for (const transaction of dayTransactions) {
                    if (transaction.type === 'deposit' || transaction.type === 'interest_earned') {
                        currentBalance += transaction.amount;
                    } else if (transaction.type === 'withdrawal' && transaction.status === 'completed') {
                        currentBalance -= transaction.amount;
                    }
                }

                dailyBalances.push({
                    date: new Date(currentDate),
                    balance: currentBalance
                });

                if (currentBalance > 0) {
                    balanceDays++;
                }
                totalDays++;

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Calculate average balance
            const totalBalance = dailyBalances.reduce((sum, day) => sum + day.balance, 0);
            const averageBalance = totalDays > 0 ? totalBalance / totalDays : 0;

            return Math.round(averageBalance);
        } catch (error) {
            console.error('Error calculating average balance:', error);
            return 0;
        }
    }

    /**
     * Get interest statistics for admin dashboard
     * @returns {Object} Interest statistics
     */
    static async getInterestStatistics() {
        try {
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);

            // Get total interest paid this year
            const totalInterestThisYear = await Transaction.aggregate([
                {
                    $match: {
                        type: 'interest_earned',
                        createdAt: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get monthly interest breakdown
            const monthlyInterest = await Transaction.aggregate([
                {
                    $match: {
                        type: 'interest_earned',
                        createdAt: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$createdAt' },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id': 1 }
                }
            ]);

            // Get users with highest interest earned
            const topInterestEarners = await Transaction.aggregate([
                {
                    $match: {
                        type: 'interest_earned',
                        createdAt: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        totalInterest: { $sum: '$amount' }
                    }
                },
                {
                    $sort: { totalInterest: -1 }
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        userId: '$_id',
                        userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                        totalInterest: 1
                    }
                }
            ]);

            return {
                totalInterestThisYear: totalInterestThisYear[0]?.total || 0,
                transactionCount: totalInterestThisYear[0]?.count || 0,
                monthlyBreakdown: monthlyInterest,
                topEarners: topInterestEarners
            };
        } catch (error) {
            console.error('Error getting interest statistics:', error);
            throw error;
        }
    }
}

module.exports = InterestService; 