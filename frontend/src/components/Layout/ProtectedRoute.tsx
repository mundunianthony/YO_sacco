import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { ROUTES } from '../../utils/constants';

interface ProtectedRouteProps {
  role: 'admin' | 'member';
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const { token, user } = useAppSelector((state) => state.auth);
  
  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  // Check if user has the required role
  if (user.role !== role) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  // User is authenticated and has the required role, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;