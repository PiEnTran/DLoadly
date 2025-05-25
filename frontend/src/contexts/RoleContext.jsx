import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Định nghĩa các role
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// Tạo context
const RoleContext = createContext();

// Hook để sử dụng context
export const useRole = () => {
  return useContext(RoleContext);
};

// Provider component
export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAuthenticated } = useAuth();

  // Kiểm tra và cập nhật role khi user thay đổi
  useEffect(() => {
    const checkUserRole = async () => {
      if (!isAuthenticated || !currentUser) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Trong thực tế, bạn sẽ gọi API để lấy vai trò của người dùng
        // Ở đây chúng ta giả lập bằng cách kiểm tra email

        // Sử dụng role từ Firebase user data thay vì email check
        let userRole = currentUser.role || ROLES.USER;

        // Temporary: Make specific email admin for testing
        if (currentUser.email === 'admin@dloadly.com' || currentUser.email === 'pien@example.com') {
          userRole = ROLES.ADMIN;
        }

        // Validate role
        const validRoles = Object.values(ROLES);
        if (validRoles.includes(userRole)) {
          setUserRole(userRole);
          localStorage.setItem('userRole', userRole);
        } else {
          // Fallback to user role if invalid
          setUserRole(ROLES.USER);
          localStorage.setItem('userRole', ROLES.USER);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(ROLES.USER); // Mặc định là người dùng thông thường nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [currentUser, isAuthenticated]);

  // Hàm kiểm tra người dùng có vai trò cụ thể không
  const hasRole = (role) => {
    if (!userRole) return false;

    // Super admin có tất cả quyền
    if (userRole === ROLES.SUPER_ADMIN) return true;

    // Admin có quyền admin và user
    if (userRole === ROLES.ADMIN && (role === ROLES.ADMIN || role === ROLES.USER)) return true;

    // User chỉ có quyền user
    if (userRole === ROLES.USER && role === ROLES.USER) return true;

    return false;
  };

  // Hàm kiểm tra người dùng có ít nhất một trong các vai trò được chỉ định không
  const hasAnyRole = (roles) => {
    if (!userRole || !roles || roles.length === 0) return false;
    return roles.some(role => hasRole(role));
  };

  // Giá trị được cung cấp cho context
  const value = {
    userRole,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin: userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN,
    isSuperAdmin: userRole === ROLES.SUPER_ADMIN,
    isUser: userRole === ROLES.USER,
    ROLES,
  };

  return (
    <RoleContext.Provider value={value}>
      {!loading && children}
    </RoleContext.Provider>
  );
};

export default RoleContext;
