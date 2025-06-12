
// YO Sacco Management System - Data Models

// User Model (Base for both Admin and Member)
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // hashed
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Member Model (extends User)
export interface Member extends User {
  role: 'member';
  address: string;
  dateOfBirth: Date;
  savingsBalance: number;
  joinDate: Date;
  nationalId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Admin Model (extends User)
export interface Admin extends User {
  role: 'admin';
  permissions: AdminPermission[];
  department?: string;
}

// Admin Permissions
export type AdminPermission = 
  | 'manage_members'
  | 'approve_loans'
  | 'view_reports'
  | 'send_notifications'
  | 'manage_savings';

// Loan Model
export interface Loan {
  id: string;
  memberId: string;
  loanType: LoanType;
  amountRequested: number;
  amountApproved?: number;
  repaymentPeriod: number; // in months
  interestRate: number; // percentage
  status: LoanStatus;
  applicationDate: Date;
  approvalDate?: Date;
  rejectionReason?: string;
  approvedBy?: string; // admin ID
  totalRepayable?: number;
  monthlyRepayment?: number;
  repaymentHistory: LoanRepayment[];
  remainingBalance: number;
  nextPaymentDate?: Date;
  collateral?: string;
  purpose: string;
}

export type LoanType = 
  | 'personal'
  | 'emergency'
  | 'business'
  | 'education'
  | 'housing';

export type LoanStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'defaulted';

// Loan Repayment Model
export interface LoanRepayment {
  id: string;
  loanId: string;
  memberId: string;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  remainingBalance: number;
  penaltyAmount?: number;
  receiptNumber: string;
  processedBy?: string; // admin ID
}

export type PaymentMethod = 
  | 'cash'
  | 'bank_transfer'
  | 'mobile_money'
  | 'check';

// Savings Transaction Model
export interface SavingsTransaction {
  id: string;
  memberId: string;
  transactionType: TransactionType;
  amount: number;
  date: Date;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  processedBy?: string; // admin ID for withdrawals
  status: TransactionStatus;
}

export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// Notification Model
export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string; // member or admin ID
  recipientType: 'member' | 'admin';
  title: string;
  message: string;
  date: Date;
  readStatus: boolean;
  actionRequired?: boolean;
  relatedEntityId?: string; // loan ID, transaction ID, etc.
  priority: NotificationPriority;
}

export type NotificationType = 
  | 'loan_application'
  | 'loan_approved'
  | 'loan_rejected'
  | 'payment_reminder'
  | 'payment_overdue'
  | 'account_status'
  | 'system_announcement'
  | 'savings_milestone';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Dashboard Stats Models
export interface MemberDashboardStats {
  memberId: string;
  totalSavings: number;
  activeLoanCount: number;
  totalLoanAmount: number;
  remainingLoanBalance: number;
  nextPaymentAmount?: number;
  nextPaymentDate?: Date;
  savingsGrowth: number; // percentage
  creditScore?: number;
}

export interface AdminDashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalSavings: number;
  totalLoansIssued: number;
  totalLoanAmount: number;
  pendingLoanApplications: number;
  defaultedLoans: number;
  collectionRate: number; // percentage
  monthlyGrowth: {
    members: number;
    savings: number;
    loans: number;
  };
}

// Application Settings Model
export interface SaccoSettings {
  id: string;
  saccoName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  interestRates: {
    [key in LoanType]: {
      [period: number]: number; // period in months -> interest rate
    };
  };
  minimumSavings: number;
  maximumLoanAmount: number;
  penaltyRate: number; // percentage for late payments
  gracePeriod: number; // days before penalty applies
  operatingHours: {
    open: string;
    close: string;
    workingDays: string[];
  };
}

// Audit Log Model (for tracking system activities)
export interface AuditLog {
  id: string;
  userId: string;
  userType: 'admin' | 'member';
  action: string;
  entityType: string; // 'loan', 'member', 'transaction', etc.
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
