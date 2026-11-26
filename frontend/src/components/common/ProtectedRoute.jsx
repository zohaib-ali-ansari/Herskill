import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireVerifiedSeller = false,
}) {
  const { user, seller, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner fullScreen label="Checking your session..." />;
  }

  if (!isAuthenticated || !user) {
    const isAdminRoute = allowedRoles?.length === 1 && allowedRoles[0] === 'admin';
    return (
      <Navigate
        to={isAdminRoute ? '/admin/login' : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles?.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      if (allowedRoles.includes('seller') && user.roles?.includes('buyer')) {
        return <Navigate to="/seller/activate" replace />;
      }
      if (user.roles?.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/buyer/dashboard" replace />;
    }
  }

  if (requireVerifiedSeller) {
    const status = seller?.verificationStatus || 'NOT_SUBMITTED';
    if (status === 'PENDING') {
      return <Navigate to="/seller/verification/pending" replace />;
    }
    if (status === 'REJECTED') {
      return <Navigate to="/seller/verification/status" replace />;
    }
    if (status !== 'APPROVED') {
      return <Navigate to="/seller/verification/intro" replace />;
    }
  }

  return children;
}
