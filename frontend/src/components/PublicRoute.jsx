import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// PublicRoute dành cho các trang như login, register
// Nếu người dùng đã đăng nhập, họ sẽ được chuyển hướng đến trang chủ hoặc trang trước đó
const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Lấy đường dẫn từ state (nếu được chuyển hướng từ ProtectedRoute)
  const from = location.state?.from || '/';
  
  // Nếu route bị hạn chế (như login/register) và người dùng đã đăng nhập
  // thì chuyển hướng đến trang chủ hoặc trang trước đó
  if (restricted && isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  
  // Nếu không bị hạn chế hoặc người dùng chưa đăng nhập, hiển thị nội dung
  return children;
};

export default PublicRoute;
