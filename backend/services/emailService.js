const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Sử dụng Gmail SMTP với App Password
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'dloadly.service@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'your-app-password'
        }
      });

      // Test connection
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        if (process.env.EMAIL_PASSWORD === 'your_16_char_app_password_here') {
          console.log('⚠️ Please update EMAIL_PASSWORD with your Gmail App Password');
          console.log('💡 Create App Password at: https://myaccount.google.com/apppasswords');
          this.initialized = false;
          return;
        }

        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
        console.log(`📧 Email configured for: ${process.env.EMAIL_USER}`);
        this.initialized = true;
      } else {
        console.log('⚠️ Email credentials not provided - email notifications disabled');
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      if (error.message.includes('Username and Password not accepted')) {
        console.log('💡 Solution: Create Gmail App Password at https://myaccount.google.com/apppasswords');
        console.log('📋 Steps: Google Account → Security → 2-Step Verification → App passwords');
      }
      this.initialized = false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async sendFileReadyNotification(userEmail, fileName, driveLink, userName = '', folderLink = null) {
    if (!this.initialized) {
      console.log('Email service not initialized - skipping notification');
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'DLoadly - Social Media Downloader',
          address: process.env.EMAIL_USER || 'dloadly.service@gmail.com'
        },
        to: userEmail,
        subject: `🎉 File "${fileName}" đã sẵn sàng tải xuống!`,
        html: this.generateFileReadyEmailTemplate(userName, fileName, driveLink, userEmail, folderLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${userEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email notification sent successfully'
      };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateFileReadyEmailTemplate(userName, fileName, driveLink, userEmail, folderLink = null) {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Sẵn Sàng Tải Xuống</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .info-box { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning-box { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 File Đã Sẵn Sàng!</h1>
                <p>DLoadly - Social Media Downloader</p>
            </div>

            <div class="content">
                <h2>Xin chào ${userName || 'bạn'}!</h2>

                <p>File <strong>"${fileName}"</strong> đã được tải xuống thành công và upload lên Google Drive.</p>

                <div class="info-box">
                    <h3>📁 Thông tin file:</h3>
                    <ul>
                        <li><strong>Tên file:</strong> ${fileName}</li>
                        <li><strong>Email nhận:</strong> ${userEmail}</li>
                        <li><strong>Trạng thái:</strong> Sẵn sàng tải xuống</li>
                        <li><strong>Lưu trữ:</strong> Google Drive</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${driveLink}" class="button" target="_blank" style="margin: 5px;">
                        📄 Xem File Này
                    </a>
                    ${folderLink ? `
                    <br><br>
                    <a href="${folderLink}" class="button" target="_blank" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); margin: 5px;">
                        📁 Xem Tất Cả Files
                    </a>
                    ` : ''}
                </div>

                <div class="warning-box">
                    <h3>📋 Hướng dẫn sử dụng:</h3>
                    <ol>
                        <li><strong>Xem file này:</strong> Click nút xanh dương để xem file vừa upload</li>
                        ${folderLink ? '<li><strong>Xem tất cả files:</strong> Click nút xanh lá để xem folder chứa tất cả files của bạn</li>' : ''}
                        <li><strong>Tải xuống:</strong> Trong Drive, click chuột phải vào file → "Tải xuống"</li>
                        <li><strong>Chia sẻ:</strong> Bạn có thể chia sẻ file với người khác từ Google Drive</li>
                    </ol>
                </div>

                <p><strong>Lưu ý:</strong> File này chỉ được chia sẻ với email <strong>${userEmail}</strong>. Nếu bạn không thể truy cập, vui lòng kiểm tra lại email hoặc liên hệ với chúng tôi.</p>

                <p>Cảm ơn bạn đã sử dụng dịch vụ DLoadly! 🚀</p>
            </div>

            <div class="footer">
                <p>© 2024 DLoadly - Social Media Downloader</p>
                <p>Email này được gửi tự động, vui lòng không reply.</p>
                <p>Nếu bạn có thắc mắc, vui lòng liên hệ: support@dloadly.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendAdminNotification(adminEmail, requestInfo) {
    if (!this.initialized) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'DLoadly Admin System',
          address: process.env.EMAIL_USER || 'dloadly.service@gmail.com'
        },
        to: adminEmail,
        subject: `🔔 Yêu cầu Fshare mới từ ${requestInfo.userName}`,
        html: this.generateAdminNotificationTemplate(requestInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Admin notification sent to ${adminEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateAdminNotificationTemplate(requestInfo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 Yêu Cầu Fshare Mới</h2>
            </div>
            <div class="content">
                <div class="info-box">
                    <h3>👤 Thông tin người yêu cầu:</h3>
                    <p><strong>Tên:</strong> ${requestInfo.userName}</p>
                    <p><strong>Email gửi:</strong> ${requestInfo.userEmail}</p>
                    <p><strong>Email nhận file:</strong> ${requestInfo.recipientEmail}</p>
                </div>
                <div class="info-box">
                    <h3>🔗 Thông tin yêu cầu:</h3>
                    <p><strong>URL:</strong> <a href="${requestInfo.url}">${requestInfo.url}</a></p>
                    <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                </div>
                <p><strong>Hành động cần thực hiện:</strong></p>
                <ol>
                    <li>Truy cập admin panel</li>
                    <li>Tải file từ Fshare</li>
                    <li>Upload file lên Google Drive</li>
                    <li>File sẽ được chia sẻ tự động với ${requestInfo.recipientEmail}</li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
