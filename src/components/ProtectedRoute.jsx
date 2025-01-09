import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth-store';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Route based on user role
  if (user?.role === 'operator' && !location.pathname.startsWith('/operator')) {
    return <Navigate to="/operator/dashboard" replace />;
  }

  if (user?.role === 'supervisor' && !location.pathname.startsWith('/supervisor')) {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 