const mongoose = require('mongoose');
const NotificationService = require('../services/notificationService');
require('dotenv').config();

async function createTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminId = '65f1a2b3c4d5e6f7g8h9i0j1'; // Replace with actual admin ID

    // Member Management Notifications
    await NotificationService.notifyNewMemberRegistration(adminId, 'John Doe');
    await NotificationService.notifyMemberStatusChange(adminId, 'Jane Smith', 'active');
    await NotificationService.notifyMemberDeactivation(adminId, 'Bob Johnson');

    // Loan Management Notifications
    await NotificationService.notifyNewLoanApplication(adminId, 'Alice Brown', 5000);
    await NotificationService.notifyLoanApprovalRequired(adminId, '12345');
    await NotificationService.notifyLoanPaymentOverdue(adminId, 'Charlie Davis', 1000);
    await NotificationService.notifyLargeLoanRequest(adminId, 'Eve Wilson', 10000);

    // Financial Notifications
    await NotificationService.notifyLargeDeposit(adminId, 'Frank Miller', 5000);
    await NotificationService.notifyLargeWithdrawal(adminId, 'Grace Lee', 3000);
    await NotificationService.notifyUnusualTransaction(adminId, 'Henry Taylor');
    await NotificationService.notifyDailyFinancialSummary(adminId, 15000, 8000);

    // System Notifications
    await NotificationService.notifySystemError(adminId, 'Database connection timeout');
    await NotificationService.notifyDatabaseBackup(adminId, 'completed successfully');
    await NotificationService.notifySystemMaintenance(adminId, 2);

    // Compliance Notifications
    await NotificationService.notifyKycDocumentUpdate(adminId, 'Ivy Martinez');
    await NotificationService.notifyComplianceDeadline(adminId, 5);

    // Emergency Notifications
    await NotificationService.notifyCriticalSystemIssue(adminId, 'Server CPU usage at 95%');
    await NotificationService.notifySecurityBreach(adminId, 'Multiple failed login attempts detected');

    // Staff Management Notifications
    await NotificationService.notifyStaffLogin(adminId, 'Admin User', '192.168.1.1');
    await NotificationService.notifyStaffAction(adminId, 'Admin User', 'approved 5 loan applications');
    await NotificationService.notifyStaffPerformanceAlert(adminId, 'Admin User', 3);

    console.log('Test notifications created successfully');
  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestNotifications(); 