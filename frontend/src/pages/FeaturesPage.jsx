import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaDownload, FaVideo, FaMusic, FaImage, FaDatabase, FaCloud, FaLock, FaBolt, FaMobileAlt, FaDesktop } from 'react-icons/fa';

const FeaturesPage = () => {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
            Tính Năng
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Tính năng 1 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaVideo className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tải Video Từ Nhiều Nền Tảng</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Hỗ trợ tải video từ nhiều nền tảng mạng xã hội phổ biến như YouTube, TikTok, Facebook, Instagram và Twitter với chất lượng cao.
              </p>
            </div>

            {/* Tính năng 2 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaMusic className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tải Nhạc MP3</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Trích xuất âm thanh từ video và tải xuống dưới dạng file MP3 chất lượng cao, phù hợp để nghe nhạc offline.
              </p>
            </div>

            {/* Tính năng 3 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaImage className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tải Hình Ảnh</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Tải xuống hình ảnh chất lượng cao từ Instagram, Facebook và các nền tảng mạng xã hội khác.
              </p>
            </div>

            {/* Tính năng 4 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaDatabase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tải File Từ Fshare</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Tải xuống file từ Fshare với tốc độ cao thông qua tài khoản VIP, không cần đăng ký tài khoản Fshare.
              </p>
            </div>

            {/* Tính năng 5 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Lưu Trữ Trên Google Drive</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Tải file lên Google Drive để dễ dàng chia sẻ và truy cập từ bất kỳ thiết bị nào.
              </p>
            </div>

            {/* Tính năng 6 */}
            <div className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                  <FaLock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Bảo Mật Và Riêng Tư</h3>
              </div>
              <p className="text-[var(--text-secondary)]">
                Không lưu trữ thông tin cá nhân, đảm bảo quyền riêng tư và bảo mật cho người dùng.
              </p>
            </div>
          </div>

          <div className="bg-[var(--card-background-secondary)] rounded-xl p-8 mb-12 border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">Tại Sao Chọn DLoadly?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaBolt className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Nhanh Chóng</h3>
                <p className="text-[var(--text-secondary)]">Tải xuống với tốc độ cao, không phải chờ đợi lâu.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaMobileAlt className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Tương Thích</h3>
                <p className="text-[var(--text-secondary)]">Hoạt động trên mọi thiết bị và trình duyệt hiện đại.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaDesktop className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Dễ Sử Dụng</h3>
                <p className="text-[var(--text-secondary)]">Giao diện đơn giản, thân thiện với người dùng.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
