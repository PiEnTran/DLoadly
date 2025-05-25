import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaDownload, FaCheck } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
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

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Đánh giá độ mạnh của mật khẩu
    const { password } = formData;
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }

    let strength = 0;
    let feedback = '';

    // Độ dài
    if (password.length >= 8) {
      strength += 1;
    }

    // Chữ hoa và chữ thường
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength += 1;
    }

    // Số
    if (/[0-9]/.test(password)) {
      strength += 1;
    }

    // Ký tự đặc biệt
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1;
    }

    // Phản hồi
    if (strength === 0) {
      feedback = 'Rất yếu';
    } else if (strength === 1) {
      feedback = 'Yếu';
    } else if (strength === 2) {
      feedback = 'Trung bình';
    } else if (strength === 3) {
      feedback = 'Mạnh';
    } else {
      feedback = 'Rất mạnh';
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  }, [formData.password]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra mật khẩu khớp nhau
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Kiểm tra đồng ý điều khoản
    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản dịch vụ.');
      return;
    }

    setIsLoading(true);

    try {
      // Sử dụng hàm register từ AuthContext
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        // Đăng ký thành công
        if (result.needEmailVerification) {
          // Chuyển hướng đến trang nhập mã OTP
          navigate('/verify-email-code', {
            state: {
              email: result.email || formData.email,
              fromRegister: true
            }
          });
        } else {
          // Chuyển hướng đến trang đăng nhập (fallback)
          navigate('/login', { state: { registered: true } });
        }
      } else {
        // Đăng ký thất bại
        setError(result.error || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      setError('Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Xử lý đăng ký bằng Google
    console.log('Đăng ký bằng Google');
  };

  const handleFacebookRegister = () => {
    // Xử lý đăng ký bằng Facebook
    console.log('Đăng ký bằng Facebook');
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return 'bg-gray-300 dark:bg-gray-700';
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300 dark:bg-gray-700';
    }
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
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Đăng Ký</h1>
              <p className="text-[var(--text-secondary)] mt-2">
                Tạo tài khoản để sử dụng đầy đủ tính năng của DLoadly
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-[var(--text-tertiary)]" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-[var(--input-border)] rounded-lg bg-[var(--input-background)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Họ và tên"
                    required
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-[var(--text-tertiary)]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-[var(--input-border)] rounded-lg bg-[var(--input-background)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Email của bạn"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrengthColor()} rounded-full transition-all duration-300`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-[var(--text-secondary)]">{passwordFeedback}</span>
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-[var(--text-tertiary)]" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-[var(--input-border)] rounded-lg bg-[var(--input-background)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Xác nhận mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-[var(--text-tertiary)]" />
                    ) : (
                      <FaEye className="h-5 w-5 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[var(--input-border)] rounded"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-[var(--text-secondary)]">
                  Tôi đồng ý với <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Chính sách bảo mật</Link>
                </label>
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
                    "Đăng Ký"
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
                    Hoặc đăng ký với
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleRegister}
                  className="w-full flex justify-center py-2 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                  Google
                </button>
                <button
                  onClick={handleFacebookRegister}
                  className="w-full flex justify-center py-2 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <FaFacebook className="h-5 w-5 text-blue-600 mr-2" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-[var(--text-secondary)]">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  Đăng nhập
                </Link>
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>📝 Lưu ý:</strong> Tài khoản mới sẽ có quyền "User" mặc định.
                  Chỉ Admin mới có thể thay đổi quyền của người dùng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
