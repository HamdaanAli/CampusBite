
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-page">Loading CampusBite...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardPaths = {
      CUSTOMER: '/',
      RESTAURANT_OWNER: '/owner',
      DELIVERY_PARTNER: '/delivery',
    };

    return (
      <Navigate
        to={dashboardPaths[user.role] || '/'}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;