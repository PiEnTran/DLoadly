import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Lấy đường dẫn từ state (nếu được chuyển hướng từ ProtectedRoute)
  const from = location.state?.from || '/';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);

    // Kiểm tra thông báo từ state
    if (location.state?.emailVerified) {
      setSuccessMessage('Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.');
    } else if (location.state?.registered) {
      setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.');
    }
  }, [theme, location.state]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sử dụng hàm login từ AuthContext
      const result = await login(email, password, rememberMe);

      if (result.success) {
        // Đăng nhập thành công, chuyển hướng đến trang trước đó hoặc trang chủ
        navigate(from);
      } else {
        // Đăng nhập thất bại
        if (result.needEmailVerification) {
          // Chuyển hướng đến trang nhập mã OTP
          navigate('/verify-email-code', {
            state: {
              email: result.email || email,
              fromLogin: true
            }
          });
        } else {
          setError(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
      }
    } catch (error) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Xử lý đăng nhập bằng Google
    console.log('Đăng nhập bằng Google');
  };

  const handleFacebookLogin = () => {
    // Xử lý đăng nhập bằng Facebook
    console.log('Đăng nhập bằng Facebook');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--card-background)] rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-[var(--border-color)] transform transition-all duration-300 hover:shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 mb-4">
                <FaDownload className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Đăng Nhập</h1>
              <p className="text-[var(--text-secondary)] mt-2">
                Đăng nhập để sử dụng đầy đủ tính năng của DLoadly
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-[var(--text-tertiary)]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[var(--input-border)] rounded-lg bg-[var(--input-background)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Email của bạn"
                    required
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-[var(--text-tertiary)]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-[var(--input-border)] rounded-lg bg-[var(--input-background)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-[var(--text-tertiary)]" />
                    ) : (
                      <FaEye className="h-5 w-5 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[var(--input-border)] rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-secondary)]">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </div>
                  ) : (
                    "Đăng Nhập"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-color)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--card-background)] text-[var(--text-secondary)]">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex justify-center py-2 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                  Google
                </button>
                <button
                  onClick={handleFacebookLogin}
                  className="w-full flex justify-center py-2 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <FaFacebook className="h-5 w-5 text-blue-600 mr-2" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[var(--text-secondary)]">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
