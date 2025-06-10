import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Auth pages
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';

// Member pages
import MemberDashboard from '../pages/Member/MemberDashboard';
import SavingsPage from '../pages/Member/SavingsPage';
import LoanApplicationPage from '../pages/Member/LoanApplicationPage';
import TransactionHistoryPage from '../pages/Member/TransactionHistoryPage';
import ProfilePage from '../pages/Member/ProfilePage';
import MessagesPage from '../pages/Member/MessagesPage';

// Admin pages
import AdminDashboard from '../pages/Admin/AdminDashboard';
import MemberManagementPage from '../pages/Admin/MemberManagementPage';
import LoanRequestsPage from '../pages/Admin/LoanRequestsPage';
import AllTransactionsPage from '../pages/Admin/AllTransactionsPage';
import MessagingPage from '../pages/Admin/MessagingPage';
import ReportsPage from '../pages/Admin/ReportsPage';

// Shared components
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/Layout/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      {/* Member routes */}
      <Route element={<ProtectedRoute role="member" />}>
        <Route path={ROUTES.MEMBER_DASHBOARD} element={<MemberDashboard />} />
        <Route path={ROUTES.MEMBER_SAVINGS} element={<SavingsPage />} />
        <Route path={ROUTES.MEMBER_LOANS} element={<LoanApplicationPage />} />
        <Route path={ROUTES.MEMBER_HISTORY} element={<TransactionHistoryPage />} />
        <Route path={ROUTES.MEMBER_PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.MEMBER_MESSAGES} element={<MessagesPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.ADMIN_MEMBERS} element={<MemberManagementPage />} />
        <Route path={ROUTES.ADMIN_LOAN_REQUESTS} element={<LoanRequestsPage />} />
        <Route path={ROUTES.ADMIN_TRANSACTIONS} element={<AllTransactionsPage />} />
        <Route path={ROUTES.ADMIN_MESSAGES} element={<MessagingPage />} />
        <Route path={ROUTES.ADMIN_REPORTS} element={<ReportsPage />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;