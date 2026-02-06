import { Navigate } from 'react-router-dom';
import useAdminAuthStore from '../../stores/adminAuthStore';

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, hasAccess } = useAdminAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!hasAccess()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
