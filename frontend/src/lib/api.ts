import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    guarantors?: Array<{
      name: string;
      phone: string;
      address: string;
      relationship: string;
    }>;
  }) => api.post('/members/loans', data),
  makeLoanPayment: (loanId: string, data: { amount: number; paymentMethod: string }) =>
    api.post(`/members/loans/${loanId}/payment`, data),
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
};

// Notification API
export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api; 