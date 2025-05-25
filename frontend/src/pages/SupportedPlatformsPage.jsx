import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaYoutube, FaTiktok, FaFacebook, FaInstagram, FaTwitter, FaDatabase, FaCheck, FaTimes } from 'react-icons/fa';

const SupportedPlatformsPage = () => {
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

  const platforms = [
    {
      name: 'YouTube',
      icon: <FaYoutube className="h-8 w-8 text-red-600" />,
      description: 'Tải video, âm thanh và danh sách phát từ YouTube với nhiều tùy chọn chất lượng.',
      features: [
        { name: 'Video MP4', supported: true },
        { name: 'Âm thanh MP3', supported: true },
        { name: 'Chất lượng 4K', supported: true },
        { name: 'Danh sách phát', supported: true },
        { name: 'Video có bảo vệ', supported: false }
      ]
    },
    {
      name: 'TikTok',
      icon: <FaTiktok className="h-8 w-8 text-black dark:text-white" />,
      description: 'Tải video TikTok không có watermark với chất lượng cao.',
      features: [
        { name: 'Video không watermark', supported: true },
        { name: 'Âm thanh MP3', supported: true },
        { name: 'Tải nhiều video', supported: false },
        { name: 'Video riêng tư', supported: false },
        { name: 'Video trực tiếp', supported: false }
      ]
    },
    {
      name: 'Facebook',
      icon: <FaFacebook className="h-8 w-8 text-blue-600" />,
      description: 'Tải video, hình ảnh và album từ Facebook.',
      features: [
        { name: 'Video công khai', supported: true },
        { name: 'Hình ảnh', supported: true },
        { name: 'Album ảnh', supported: true },
        { name: 'Video nhóm', supported: false },
        { name: 'Video riêng tư', supported: false }
      ]
    },
    {
      name: 'Instagram',
      icon: <FaInstagram className="h-8 w-8 text-pink-600" />,
      description: 'Tải video, hình ảnh, story và IGTV từ Instagram.',
      features: [
        { name: 'Video bài đăng', supported: true },
        { name: 'Hình ảnh', supported: true },
        { name: 'Story', supported: true },
        { name: 'IGTV', supported: true },
        { name: 'Tài khoản riêng tư', supported: false }
      ]
    },
    {
      name: 'Twitter',
      icon: <FaTwitter className="h-8 w-8 text-blue-400" />,
      description: 'Tải video và GIF từ Twitter với chất lượng cao.',
      features: [
        { name: 'Video', supported: true },
        { name: 'GIF', supported: true },
        { name: 'Hình ảnh', supported: true },
        { name: 'Video trực tiếp', supported: false },
        { name: 'Tài khoản riêng tư', supported: false }
      ]
    },
    {
      name: 'Fshare',
      icon: <FaDatabase className="h-8 w-8 text-green-600" />,
      description: 'Tải file từ Fshare với tốc độ cao thông qua tài khoản VIP.',
      features: [
        { name: 'File công khai', supported: true },
        { name: 'Tốc độ cao', supported: true },
        { name: 'Tải lên Google Drive', supported: true },
        { name: 'File có mật khẩu', supported: false },
        { name: 'Folder', supported: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
            Nền Tảng Hỗ Trợ
          </h1>

          <p className="text-[var(--text-secondary)] text-center mb-12 text-lg">
            DLoadly hỗ trợ tải xuống nội dung từ nhiều nền tảng mạng xã hội phổ biến và dịch vụ lưu trữ file.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {platforms.map((platform, index) => (
              <div key={index} className="bg-[var(--card-background)] rounded-xl shadow-md p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--platform-icon-bg)] flex items-center justify-center mr-4 border border-[var(--border-color)]">
                    {platform.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">{platform.name}</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">
                  {platform.description}
                </p>
                <div className="space-y-2">
                  {platform.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">{feature.name}</span>
                      {feature.supported ? (
                        <FaCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <FaTimes className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card-background-secondary)] rounded-xl p-8 mb-12 border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">Định Dạng Hỗ Trợ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--card-background)] rounded-lg p-4 border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold mb-2 text-center text-[var(--text-primary)]">Video</h3>
                <ul className="text-[var(--text-secondary)] text-center space-y-1">
                  <li>MP4</li>
                  <li>WebM</li>
                  <li>MOV</li>
                  <li>AVI</li>
                  <li>MKV</li>
                </ul>
              </div>
              
              <div className="bg-[var(--card-background)] rounded-lg p-4 border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold mb-2 text-center text-[var(--text-primary)]">Âm Thanh</h3>
                <ul className="text-[var(--text-secondary)] text-center space-y-1">
                  <li>MP3</li>
                  <li>AAC</li>
                  <li>WAV</li>
                  <li>FLAC</li>
                  <li>OGG</li>
                </ul>
              </div>
              
              <div className="bg-[var(--card-background)] rounded-lg p-4 border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold mb-2 text-center text-[var(--text-primary)]">Hình Ảnh</h3>
                <ul className="text-[var(--text-secondary)] text-center space-y-1">
                  <li>JPG/JPEG</li>
                  <li>PNG</li>
                  <li>GIF</li>
                  <li>WebP</li>
                  <li>BMP</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportedPlatformsPage;
