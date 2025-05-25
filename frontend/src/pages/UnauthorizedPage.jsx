import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';

const UnauthorizedPage = () => {
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

  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--card-background)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] transform transition-all duration-300 hover:shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Không Có Quyền Truy Cập</h1>
              <p className="text-[var(--text-secondary)] mt-2">
                Bạn không có quyền truy cập vào trang này. Trang này chỉ dành cho quản trị viên.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate(-1)}
                className="w-full flex justify-center items-center py-3 px-4 border border-[var(--border-color)] rounded-lg shadow-sm bg-[var(--card-background-secondary)] text-[var(--text-primary)] hover:bg-[var(--input-background)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <FaArrowLeft className="h-4 w-4 mr-2" />
                Quay lại trang trước
              </button>
              
              <Link
                to="/"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <FaHome className="h-4 w-4 mr-2" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnauthorizedPage;
