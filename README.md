# DLoadly - Công cụ tải video từ mạng xã hội

DLoadly là ứng dụng web hiện đại cho phép người dùng tải xuống nội dung (hình ảnh, video) từ các nền tảng mạng xã hội và Fshare sử dụng API miễn phí/mã nguồn mở.

## Tính năng

- Tải video từ YouTube, TikTok, Instagram, Facebook và Twitter
- Tải file từ Fshare và tải lên lại Google Drive
- Giao diện hiện đại, responsive với chế độ sáng/tối
- Không yêu cầu API trả phí

## Nền tảng được hỗ trợ

- YouTube
- TikTok
- Instagram (Reels, Video, Hình ảnh)
- Facebook
- Twitter/X
- Fshare

## Công nghệ sử dụng

### Frontend
- React.js
- Tailwind CSS
- Axios cho các yêu cầu API
- React Icons
- React Hot Toast cho thông báo

### Backend
- Node.js với Express
- yt-dlp cho tải xuống từ YouTube, Facebook và Twitter
- API công khai cho TikTok và Instagram
- Google Drive API để lưu trữ file
- Tích hợp API Fshare

## Hướng dẫn cài đặt

### Yêu cầu
- Node.js (v14 trở lên)
- npm hoặc yarn
- yt-dlp đã cài đặt trên hệ thống của bạn
- Tài khoản Google Cloud (cho Google Drive API)
- Tài khoản Fshare VIP (để tải xuống từ Fshare)

### Cài đặt

1. Clone repository:
   ```
   git clone https://github.com/yourusername/dloadly.git
   cd dloadly
   ```

2. Cài đặt dependencies cho frontend:
   ```
   cd frontend
   npm install
   ```

3. Cài đặt dependencies cho backend:
   ```
   cd ../backend
   npm install
   ```

4. Thiết lập biến môi trường:
   - Sao chép `.env.example` thành `.env` trong thư mục backend
   - Điền thông tin đăng nhập Fshare và chi tiết Google Drive API

5. Thiết lập Google Drive API:
   - Tạo dự án trong Google Cloud Console
   - Kích hoạt Google Drive API
   - Tạo tài khoản dịch vụ và tải xuống file JSON thông tin xác thực
   - Đặt file thông tin xác thực tại `backend/config/google-credentials.json`

6. Cài đặt yt-dlp:
   - Tải xuống yt-dlp từ [trang chủ](https://github.com/yt-dlp/yt-dlp/releases)
   - Đặt file thực thi yt-dlp vào thư mục `backend/bin`
   - Đảm bảo file có quyền thực thi

### Chạy ứng dụng

1. Khởi động máy chủ backend:
   ```
   cd backend
   npm run dev
   ```

2. Khởi động máy chủ phát triển frontend:
   ```
   cd frontend
   npm run dev
   ```

3. Mở trình duyệt và truy cập `http://localhost:5173`

## Cách sử dụng

1. Dán URL từ nền tảng được hỗ trợ vào trường nhập liệu
2. Nhấp vào "Tải Xuống"
3. Đợi quá trình xử lý hoàn tất
4. Tải xuống nội dung hoặc sao chép liên kết

## Cài đặt yt-dlp

### Windows
1. Tải xuống file yt-dlp.exe từ [trang chủ](https://github.com/yt-dlp/yt-dlp/releases)
2. Đặt file vào thư mục `backend/bin`

### macOS/Linux
1. Tải xuống yt-dlp từ [trang chủ](https://github.com/yt-dlp/yt-dlp/releases)
2. Đặt file vào thư mục `backend/bin`
3. Cấp quyền thực thi: `chmod +x backend/bin/yt-dlp`

## Thiết lập Google Drive API

Xem hướng dẫn chi tiết trong file [backend/config/README.md](backend/config/README.md)

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT - xem file LICENSE để biết chi tiết.

## Tuyên bố miễn trừ trách nhiệm

Công cụ này chỉ dành cho mục đích cá nhân. Vui lòng tôn trọng luật bản quyền và điều khoản dịch vụ của các nền tảng mà bạn tải xuống.
# DLoadly
