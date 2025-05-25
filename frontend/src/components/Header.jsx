import { FaSun, FaMoon, FaDownload, FaVideo, FaCog, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { networkMonitor } from '../utils/networkUtils';

const Header = ({ theme, toggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(networkMonitor.getStatus());
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useRole();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleNetworkChange = (status) => {
      setIsOnline(status === 'online');
    };

    networkMonitor.addListener(handleNetworkChange);

    return () => {
      networkMonitor.removeListener(handleNetworkChange);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 header ${
      scrolled
        ? 'bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md shadow-lg'
        : 'bg-white dark:bg-[#111827]'
    } dark:text-white dark:bg-[#111827]`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center min-w-0 flex-shrink-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-500 rounded-lg"></div>
            <div className="absolute inset-0.5 bg-white dark:bg-[#111827] rounded-lg flex items-center justify-center">
              <FaDownload className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold ml-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
              DLoadly
            </span>
          </h1>

          <div className="hidden md:flex items-center ml-3 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
            <FaVideo className="h-3 w-3 text-indigo-500 mr-1" />
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
              Tải Video Mạng Xã Hội
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4 mr-6">
            <Link
              to="/features"
              className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`}
            >
              Tính Năng
            </Link>
            <Link
              to="/how-to-use"
              className={`nav-link ${location.pathname === '/how-to-use' ? 'active' : ''}`}
            >
              Cách Sử Dụng
            </Link>
            <Link
              to="/supported-platforms"
              className={`nav-link ${location.pathname === '/supported-platforms' ? 'active' : ''}`}
            >
              Nền Tảng Hỗ Trợ
            </Link>
          </nav>

          {/* Mobile Menu Button - Enhanced touch target */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle mobile menu"
          >
            {showMobileMenu ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center space-x-3">
            {/* Network Status Indicator */}
            {!isOnline && (
              <div className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="hidden sm:inline">Offline</span>
                <span className="sm:hidden">!</span>
              </div>
            )}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="hidden md:flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Đăng Nhập
                </Link>

                <Link
                  to="/register"
                  className="hidden md:flex items-center px-4 py-2 border border-indigo-600 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Đăng Ký
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow min-h-[44px]"
                >
                  <FaUser className="h-5 w-5" />
                  <span className="hidden md:inline text-sm font-medium">{currentUser?.email?.split('@')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaUser className="inline mr-2" />
                      Hồ sơ
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FaCog className="inline mr-2" />
                        Quản trị
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FaSignOutAlt className="inline mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="space-y-2">
              <Link
                to="/features"
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/features'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Tính Năng
              </Link>
              <Link
                to="/how-to-use"
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/how-to-use'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Cách Sử Dụng
              </Link>
              <Link
                to="/supported-platforms"
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/supported-platforms'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Nền Tảng Hỗ Trợ
              </Link>

              {/* Mobile Auth Links */}
              {!isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-center min-h-[44px] flex items-center justify-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 rounded-md text-base font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-center min-h-[44px] flex items-center justify-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Đăng Ký
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FaUser className="inline mr-2" />
                    Hồ sơ
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FaCog className="inline mr-2" />
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
