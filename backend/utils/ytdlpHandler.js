const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');

// Đường dẫn đến thư mục tạm để lưu file tải xuống
const tempDir = path.join(__dirname, '..', 'temp');

// Đảm bảo thư mục tạm tồn tại
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Tải xuống từ URL bằng yt-dlp
 * @param {string} url - URL để tải xuống
 * @param {Object} options - Tùy chọn tải xuống
 * @returns {Promise<Object>} - Thông tin về file đã tải xuống
 */
const downloadWithYtDlp = async (url, options = {}) => {
  try {
    console.log(`Downloading from ${url} using yt-dlp...`);

    // Tạo tên file duy nhất để tránh xung đột
    const uniqueId = uuidv4();
    const outputTemplate = path.join(tempDir, `${uniqueId}_%(title)s.%(ext)s`);

    // Đường dẫn đến file cấu hình
    const configPath = path.join(__dirname, '..', 'config', 'ytdlp-config.txt');

    // Xây dựng các tham số cho yt-dlp
    const args = [
      url,
      '--config-location', configPath,
      '-o', outputTemplate,
      '--print', 'filename'
    ];

    // Thêm tùy chọn chất lượng nếu có
    if (options.quality) {
      args.push('-f', options.quality);
    }

    // Thêm tùy chọn cho Fshare nếu cần
    if (url.includes('fshare.vn')) {
      console.log('Detected Fshare URL, using VIP account for high-speed download...');
      // Thêm tùy chọn để hiển thị thông tin chi tiết hơn cho debug
      args.push('--verbose');
    }

    // Tạo một promise để xử lý quá trình tải xuống
    return new Promise((resolve, reject) => {
      // Tìm đường dẫn đến yt-dlp
      let ytdlpPath = '/Users/pien/Library/Python/3.9/bin/yt-dlp';

      // Kiểm tra các đường dẫn phổ biến nếu đường dẫn mặc định không tồn tại
      if (!fs.existsSync(ytdlpPath)) {
        const possiblePaths = [
          '/usr/local/bin/yt-dlp',
          '/usr/bin/yt-dlp',
          '/opt/homebrew/bin/yt-dlp',
          '/opt/local/bin/yt-dlp'
        ];

        for (const path of possiblePaths) {
          if (fs.existsSync(path)) {
            ytdlpPath = path;
            console.log(`Found yt-dlp at: ${ytdlpPath}`);
            break;
          }
        }
      }

      // Kiểm tra xem yt-dlp có tồn tại không
      if (!fs.existsSync(ytdlpPath)) {
        return reject(new Error('yt-dlp not found. Please install it with: pip install yt-dlp'));
      }

      // Khởi chạy yt-dlp
      const ytdlp = spawn(ytdlpPath, args);

      let outputFilename = '';
      let errorOutput = '';

      // Xử lý dữ liệu đầu ra
      ytdlp.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`yt-dlp output: ${output}`);

        // Lưu tên file đầu ra
        if (output.startsWith(tempDir)) {
          outputFilename = output;
        }
      });

      // Xử lý lỗi
      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`yt-dlp error: ${data.toString()}`);
      });

      // Xử lý khi quá trình hoàn tất
      ytdlp.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`yt-dlp exited with code ${code}: ${errorOutput}`));
        }

        if (!outputFilename || !fs.existsSync(outputFilename)) {
          return reject(new Error('Failed to download file or file not found'));
        }

        // Lấy thông tin file
        const stats = fs.statSync(outputFilename);
        const fileName = path.basename(outputFilename);

        resolve({
          fileName,
          filePath: outputFilename,
          fileSize: stats.size
        });
      });

      // Xử lý lỗi quá trình
      ytdlp.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('Error in downloadWithYtDlp:', error);
    throw new Error(`Failed to download with yt-dlp: ${error.message}`);
  }
};

module.exports = {
  downloadWithYtDlp
};
