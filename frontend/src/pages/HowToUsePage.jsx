import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaLink, FaDownload, FaPlay, FaCloudDownloadAlt, FaCheck, FaYoutube, FaTiktok, FaFacebook, FaInstagram, FaTwitter, FaDatabase } from 'react-icons/fa';

const HowToUsePage = () => {
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
            Cách Sử Dụng
          </h1>

          <div className="bg-[var(--card-background)] rounded-xl shadow-md p-8 mb-12 border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">
              Tải Video Từ Mạng Xã Hội Trong 3 Bước Đơn Giản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaLink className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Bước 1: Sao Chép Link</h3>
                <p className="text-[var(--text-secondary)]">
                  Sao chép link video, hình ảnh hoặc file từ nền tảng mạng xã hội hoặc Fshare.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaPlay className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Bước 2: Dán Và Tải Xuống</h3>
                <p className="text-[var(--text-secondary)]">
                  Dán link vào ô tìm kiếm và nhấn nút "Tải Xuống" để bắt đầu quá trình tải xuống.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <FaCloudDownloadAlt className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Bước 3: Lưu File</h3>
                <p className="text-[var(--text-secondary)]">
                  Chọn chất lượng mong muốn và tải xuống file hoặc lưu trữ trên Google Drive.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background-secondary)] rounded-xl p-8 mb-12 border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Hướng Dẫn Chi Tiết</h2>

            <div className="space-y-8">
              <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
                <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Tải Video Từ YouTube</h3>
                <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
                  <li>Mở video YouTube bạn muốn tải xuống</li>
                  <li>Sao chép URL từ thanh địa chỉ trình duyệt</li>
                  <li>Dán URL vào ô tìm kiếm trên DLoadly</li>
                  <li>Nhấn nút "Tải Xuống"</li>
                  <li>Chọn định dạng và chất lượng video (MP4, 1080p, 720p, v.v.)</li>
                  <li>Nhấn nút tải xuống để lưu video về máy</li>
                </ol>
              </div>

              <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
                <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Tải Video Từ TikTok</h3>
                <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
                  <li>Mở ứng dụng TikTok hoặc trang web TikTok</li>
                  <li>Tìm video bạn muốn tải xuống</li>
                  <li>Nhấn vào nút "Chia sẻ" và chọn "Sao chép liên kết"</li>
                  <li>Dán URL vào ô tìm kiếm trên DLoadly</li>
                  <li>Nhấn nút "Tải Xuống"</li>
                  <li>Video sẽ được tải xuống với chất lượng cao nhất có sẵn</li>
                </ol>
              </div>

              <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
                <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Tải File Từ Fshare</h3>
                <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
                  <li>Sao chép URL file Fshare bạn muốn tải xuống</li>
                  <li>Dán URL vào ô tìm kiếm trên DLoadly</li>
                  <li>Nhấn nút "Tải Xuống"</li>
                  <li>Điền thông tin liên hệ của bạn (không bắt buộc)</li>
                  <li>Gửi yêu cầu tải xuống</li>
                  <li>Quản trị viên sẽ xử lý yêu cầu và cung cấp link tải xuống từ Google Drive</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-xl shadow-md p-8 mb-12 border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">Mẹo Hữu Ích</h2>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Chọn chất lượng phù hợp:</span> Nếu bạn có kết nối internet chậm, hãy chọn chất lượng thấp hơn để tải xuống nhanh hơn.
                </p>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Tải lên Google Drive:</span> Nếu bạn muốn chia sẻ file với người khác, hãy sử dụng tùy chọn tải lên Google Drive.
                </p>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Tải nhạc MP3:</span> Nếu bạn chỉ muốn nghe nhạc từ video, hãy chọn định dạng MP3 để tiết kiệm dung lượng.
                </p>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Kiểm tra URL:</span> Đảm bảo URL bạn dán vào là chính xác và đầy đủ để tránh lỗi khi tải xuống.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowToUsePage;
