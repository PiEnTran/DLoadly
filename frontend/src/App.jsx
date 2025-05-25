import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import UrlForm from './components/UrlForm';
import MediaDisplay from './components/MediaDisplay';
import Footer from './components/Footer';
import './styles/theme.css';

function App() {
  const [url, setUrl] = useState('');
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Update data-theme attribute on document
    document.documentElement.setAttribute('data-theme', theme);

    // Update dark mode class for Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#111827' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: theme === 'dark' ? '#34d399' : '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: theme === 'dark' ? '#f87171' : '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">


          <UrlForm
            url={url}
            setUrl={setUrl}
            setMediaData={setMediaData}
            setLoading={setLoading}
            setError={setError}
          />

          {(mediaData || loading || error) && (
            <MediaDisplay
              mediaData={mediaData}
              loading={loading}
              error={error}
            />
          )}

          {!mediaData && !loading && !error && (
            <div className="mt-12 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Cách Sử Dụng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">1. Dán Link</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Sao chép link từ bất kỳ nền tảng mạng xã hội được hỗ trợ và dán vào ô nhập liệu ở trên.
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">2. Xử Lý</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Hệ thống của chúng tôi sẽ tự động nhận diện nền tảng và xử lý nội dung để tải xuống.
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">3. Tải Xuống</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Nhấp vào nút tải xuống để lưu nội dung vào thiết bị của bạn với chất lượng cao.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
