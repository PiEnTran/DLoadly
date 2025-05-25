import { FaGithub, FaHeart, FaTwitter, FaYoutube, FaTiktok, FaInstagram, FaFacebook } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-lg py-12 mt-16 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        {/* Top section with logo and links */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-12 gap-8">
          <div className="mb-6 lg:mb-0 w-full lg:w-auto">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 mr-3">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  DLoadly
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tải Video Mạng Xã Hội
                </p>
              </div>
            </div>

            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm max-w-xs">
              Tải video, hình ảnh và các nội dung khác từ các nền tảng mạng xã hội phổ biến với công cụ miễn phí của chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm w-full lg:w-auto">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Nền Tảng</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#youtube" className="flex items-center">
                    <FaYoutube className="mr-2 h-4 w-4 text-red-500" />
                    YouTube
                  </a>
                </li>
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#tiktok" className="flex items-center">
                    <FaTiktok className="mr-2 h-4 w-4" />
                    TikTok
                  </a>
                </li>
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#instagram" className="flex items-center">
                    <FaInstagram className="mr-2 h-4 w-4 text-pink-500" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Nền Tảng Khác</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#facebook" className="flex items-center">
                    <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                  </a>
                </li>
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#twitter" className="flex items-center">
                    <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
                    Twitter
                  </a>
                </li>
                <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <a href="#fshare" className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    Fshare
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Về DLoadly</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                DLoadly là công cụ miễn phí giúp bạn tải xuống video, hình ảnh và các nội dung khác từ các nền tảng mạng xã hội phổ biến.
                Chúng tôi sử dụng công nghệ mã nguồn mở để cung cấp tải xuống chất lượng cao không có watermark.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <FaGithub className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 transition-colors"
                >
                  <FaTwitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

        {/* Bottom section with copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} DLoadly - Đã đăng ký bản quyền
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Công cụ này chỉ dành cho mục đích cá nhân. Vui lòng tôn trọng luật bản quyền và điều khoản dịch vụ.
            </p>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              Được tạo với <FaHeart className="h-3 w-3 text-red-500 mx-1 animate-pulse" /> bởi Đội ngũ DLoadly
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
