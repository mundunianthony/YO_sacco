import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all status codes less than 500
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle CORS errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 0) {
      console.error('CORS Error:', error);
      return Promise.reject(new Error('CORS Error: Unable to access the API'));
    }
    return Promise.reject(error);
  }
);

// Member Profile API
export const memberApi = {
  // Profile
  getProfile: () => api.get('/members/profile'),
  updateProfile: (data: any) => api.put('/members/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/members/change-password', data),

  // Dashboard
  getDashboard: () => api.get('/members/dashboard'),

  // Savings
  getSavings: () => api.get('/members/savings'),
  makeDeposit: (data: { amount: number; paymentMethod: string }) =>
    api.post('/members/savings/deposit', data),
  makeWithdrawal: (data: { amount: number; paymentMethod: string }) =>
    api.post('/members/savings/withdraw', data),

  // Loans
  getLoans: () => api.get('/members/loans'),
  applyForLoan: (data: {
    amount: number;
    purpose: string;
    term: number;
    collateral?: string;
    guarantors?: string[];
  }) => api.post('/members/loans', data),
  makeLoanPayment: (loanId: string, data: { amount: number }) =>
    api.post(`/members/loans/${loanId}/payment`, data),

  getAllMembers: () => api.get('/members/all'),

  // Interest
  getInterestSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/members/interest/summary', { params }),
  getInterestHistory: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string
  }) => api.get('/members/interest/history', { params }),
  getInterestProjection: () => api.get('/members/interest/projection'),
};

// Admin API
export const adminApi = {
  // Users
  getUsers: () => api.get('/admin/users'),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, data: { status: string }) =>
    api.put(`/admin/users/${id}/status`, data),

  // Loans
  getLoans: () => api.get('/admin/loans'),
  getLoanById: (id: string) => api.get(`/admin/loans/${id}`),
  updateLoanStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.put(`/admin/loans/${id}/status`, data),
  getLoanStats: () => api.get('/admin/loans/stats'),

  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getUserStats: () => api.get('/admin/users/stats'),

  // Transactions
  getTransactions: (params?: { type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get('/admin/transactions', { params }),
  getMemberTransactions: (memberId: string) => api.get(`/admin/users/${memberId}/transactions`),

  // Reports
  generateMemberReport: (memberId: string) => api.get(`/admin/users/${memberId}/report`),
  generateMonthlyReport: (year: number, month: number) => api.get(`/admin/reports/monthly`, { params: { year, month } }),

  // Withdrawals
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  approveWithdrawal: (id: string, data: { status: 'approved' | 'rejected'; rejectionReason?: string }) =>
    api.put(`/admin/withdrawals/${id}/approve`, data),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  sendReminder: (memberId: string, data: { message: string }) =>
    api.post(`/admin/users/${memberId}/reminder`, data),

  // Interest Management
  getInterestStats: () => api.get('/admin/interest/stats'),
  calculateInterest: (data: {
    fromDate: string;
    toDate: string;
    interestRate?: number
  }) => api.post('/admin/interest/calculate', data),
  getInterestHistory: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string
  }) => api.get('/admin/interest/history', { params }),
};

// Notification API
export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api; 