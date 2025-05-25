import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const location = useLocation();

  // Nếu đang loading, có thể hiển thị spinner hoặc skeleton
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--main-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Nếu đã đăng nhập nhưng không phải admin, chuyển hướng đến trang không có quyền
  if (!isAdmin) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  // Nếu đã đăng nhập và là admin, hiển thị nội dung của route
  return children;
};

export default AdminRoute;
