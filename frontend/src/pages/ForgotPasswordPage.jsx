import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaDownload, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordPage = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { forgotPassword } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sử dụng hàm forgotPassword từ AuthContext
      const result = await forgotPassword(email);

      if (result.success) {
        // Gửi email thành công
        setIsSubmitted(true);
      } else {
        // Gửi email thất bại
        setError(result.error || 'Không thể gửi email khôi phục. Vui lòng thử lại sau.');
      }
    } catch (error) {
      setError('Không thể gửi email khôi phục. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--card-background)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] transform transition-all duration-300 hover:shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 mb-4">
                {isSubmitted ? (
                  <FaCheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <FaDownload className="h-8 w-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {isSubmitted ? 'Email Đã Gửi' : 'Quên Mật Khẩu'}
              </h1>
              <p className="text-[var(--text-secondary)] mt-2">
                {isSubmitted
                  ? 'Vui lòng kiểm tra email của bạn để tiếp tục'
                  : 'Nhập email của bạn để khôi phục mật khẩu'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isSubmitted ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 text-center">
                    Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email <span className="font-semibold">{email}</span>. Vui lòng kiểm tra hộp thư đến của bạn.
                  </p>
                </div>

                <div className="text-center text-sm text-[var(--text-secondary)]">
                  <p>Không nhận được email? Kiểm tra thư mục spam hoặc</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
                  >
                    Thử lại với email khác
                  </button>
                </div>

                <div className="pt-4">
                  <Link
                    to="/login"
                    className="w-full flex justify-center items-center py-3 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-[var(--card-background-secondary)] text-[var(--text-primary)] hover:bg-[var(--input-background)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <FaArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            ) : (
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
                      "Gửi Hướng Dẫn Khôi Phục"
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <Link to="/login" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    <FaArrowLeft className="inline mr-1" /> Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
