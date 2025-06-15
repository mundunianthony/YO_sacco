export const LOAN_TYPES = [
  { id: 'emergency', label: 'Emergency Loan' },
  { id: 'asset', label: 'Asset Purchase' },
  { id: 'education', label: 'School Fees' },
  { id: 'business', label: 'Business Loan' },
  { id: 'personal', label: 'Personal Loan' },
];

export const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash' },
  { id: 'mobile', label: 'Mobile Money' },
  { id: 'bank', label: 'Bank Transfer' },
];

export const TRANSACTION_TYPES = [
  { id: 'all', label: 'All Transactions' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdrawal', label: 'Withdrawal' },
  { id: 'loan_disbursement', label: 'Loan Disbursement' },
  { id: 'loan_repayment', label: 'Loan Repayment' },
];

export const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DORMANT: 'dormant',
};

export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  
  // Member routes
  MEMBER_DASHBOARD: '/member/dashboard',
  MEMBER_SAVINGS: '/member/savings',
  MEMBER_LOANS: '/member/loans',
  MEMBER_HISTORY: '/member/history',
  MEMBER_PROFILE: '/member/profile',
  MEMBER_MESSAGES: '/member/messages',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MEMBERS: '/admin/members',
  ADMIN_LOAN_REQUESTS: '/admin/loan-requests',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_MESSAGES: '/admin/messages',
  ADMIN_REPORTS: '/admin/reports',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
};