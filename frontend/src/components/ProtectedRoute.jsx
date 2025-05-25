import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Nếu đang loading, có thể hiển thị spinner hoặc skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--main-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  // và lưu lại đường dẫn hiện tại để sau khi đăng nhập có thể quay lại
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung của route
  return children;
};

export default ProtectedRoute;
