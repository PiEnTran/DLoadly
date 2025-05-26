const nodemailer = require('nodemailer');
const crypto = require('crypto');

class CustomAuthEmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.verificationTokens = new Map(); // Store verification tokens
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔍 Email Service Init Debug:', {
        EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : 'Not set'
      });

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'dloadly301@gmail.com',
          pass: process.env.EMAIL_PASSWORD
        }
      });

      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        console.log('🔄 Verifying email transporter...');
        await this.transporter.verify();
        console.log('✅ Custom Auth Email Service initialized successfully');
        this.initialized = true;
      } else {
        console.log('⚠️ Email credentials missing - service not initialized');
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ Custom Auth Email Service failed:', error.message);
      console.error('❌ Full error:', error);
      this.initialized = false;
    }
  }

  // Generate and store verification code (6 digits)
  generateVerificationCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

    this.verificationTokens.set(code, {
      email,
      expiresAt,
      createdAt: Date.now(),
      type: 'verification_code'
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return code;
  }

  // Generate and store verification token (for email links)
  generateVerificationToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    this.verificationTokens.set(token, {
      email,
      expiresAt,
      createdAt: Date.now(),
      type: 'verification_token'
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  // Verify code (6 digits)
  verifyCode(code, email) {
    const tokenData = this.verificationTokens.get(code);

    if (!tokenData) {
      return { valid: false, error: 'Mã xác nhận không tồn tại' };
    }

    if (tokenData.email !== email) {
      return { valid: false, error: 'Mã xác nhận không khớp với email' };
    }

    if (Date.now() > tokenData.expiresAt) {
      this.verificationTokens.delete(code);
      return { valid: false, error: 'Mã xác nhận đã hết hạn' };
    }

    if (tokenData.type !== 'verification_code') {
      return { valid: false, error: 'Mã xác nhận không hợp lệ' };
    }

    return {
      valid: true,
      email: tokenData.email,
      createdAt: tokenData.createdAt
    };
  }

  // Verify token (for email links)
  verifyToken(token) {
    const tokenData = this.verificationTokens.get(token);

    if (!tokenData) {
      return { valid: false, error: 'Token không tồn tại' };
    }

    if (Date.now() > tokenData.expiresAt) {
      this.verificationTokens.delete(token);
      return { valid: false, error: 'Token đã hết hạn' };
    }

    return {
      valid: true,
      email: tokenData.email,
      createdAt: tokenData.createdAt
    };
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.verificationTokens.entries()) {
      if (now > data.expiresAt) {
        this.verificationTokens.delete(token);
      }
    }
  }

  // Remove token after successful verification
  removeToken(token) {
    this.verificationTokens.delete(token);
  }

  // Custom Email Verification with Code
  async sendEmailVerification(userEmail, userName) {
    if (!this.initialized) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      // Generate 6-digit verification code
      const verificationCode = this.generateVerificationCode(userEmail);

      const mailOptions = {
        from: {
          name: 'DLoadly - Social Media Downloader',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: '🔐 Mã xác nhận email - DLoadly',
        html: this.generateEmailVerificationTemplate(userName, verificationCode, userEmail)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Custom email verification sent to ${userEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        code: verificationCode
      };
    } catch (error) {
      console.error('❌ Failed to send custom email verification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resend email verification
  async resendEmailVerification(userEmail, userName) {
    // Remove any existing tokens for this email
    for (const [token, data] of this.verificationTokens.entries()) {
      if (data.email === userEmail) {
        this.verificationTokens.delete(token);
      }
    }

    // Send new verification email
    return await this.sendEmailVerification(userEmail, userName);
  }

  // Custom Password Reset
  async sendPasswordReset(userEmail, userName, resetToken) {
    if (!this.initialized) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: {
          name: 'DLoadly - Bảo mật tài khoản',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: '🔐 Đặt lại mật khẩu - DLoadly',
        html: this.generatePasswordResetTemplate(userName, resetLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Custom password reset sent to ${userEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Failed to send custom password reset:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateEmailVerificationTemplate(userName, verificationCode, userEmail) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận email - DLoadly</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <div style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px;">🚀 DLoadly</div>
                <div style="color: white; font-size: 18px; opacity: 0.9;">Social Media Downloader</div>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <div style="color: #333; font-size: 20px; font-weight: bold; margin-bottom: 20px;">Chào ${userName || 'bạn'}! 👋</div>
                <h1 style="color: #333; font-size: 26px; font-weight: bold; margin-bottom: 25px; text-align: center;">Xác nhận địa chỉ email của bạn</h1>

                <div style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                    <p>Cảm ơn bạn đã tham gia cộng đồng DLoadly! 🎉</p>
                    <p>Để hoàn tất quá trình đăng ký và đảm bảo bảo mật tài khoản <strong>${userEmail}</strong>, vui lòng nhập mã xác nhận bên dưới vào ứng dụng:</p>
                </div>

                <!-- Verification Code -->
                <div style="text-align: center; margin: 35px 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px 40px; border-radius: 15px; display: inline-block; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">MÃ XÁC NHẬN</div>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Có hiệu lực trong 15 phút</div>
                    </div>
                </div>

                <!-- Info Box -->
                <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold;">💡 Tại sao cần xác nhận email?</p>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
                        <li>Bảo vệ tài khoản của bạn khỏi truy cập trái phép</li>
                        <li>Nhận thông báo quan trọng về tài khoản</li>
                        <li>Khôi phục mật khẩu khi cần thiết</li>
                        <li>Trải nghiệm đầy đủ tính năng DLoadly</li>
                        <li>Nhận thông báo khi file download sẵn sàng</li>
                    </ul>
                </div>

                <!-- Divider -->
                <div style="height: 2px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 30px 0; border-radius: 1px;"></div>

                <!-- Instructions -->
                <div style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                    <p><strong>📱 Hướng dẫn nhập mã:</strong></p>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Mở ứng dụng DLoadly trên thiết bị của bạn</li>
                        <li>Nhập mã <strong>6 số</strong> ở trên vào ô xác nhận</li>
                        <li>Nhấn "Xác nhận" để hoàn tất đăng ký</li>
                    </ol>
                </div>

                <!-- Warning Box -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold;">⚠️ Lưu ý quan trọng:</p>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
                        <li>Mã này sẽ hết hạn sau <strong>15 phút</strong></li>
                        <li>Mỗi mã chỉ sử dụng được <strong>một lần</strong></li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                        <li>Nếu không nhận được mã, kiểm tra thư mục spam</li>
                        <li>Bạn có thể yêu cầu gửi lại mã mới nếu cần</li>
                    </ul>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 30px; text-align: center; color: #666;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">🚀 DLoadly - Social Media Downloader</p>
                <p style="margin: 0 0 25px 0;">Tải xuống video và hình ảnh từ các nền tảng mạng xã hội một cách dễ dàng và nhanh chóng</p>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">Email này được gửi tự động từ hệ thống DLoadly</p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">Vui lòng không trả lời email này</p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">© 2024 DLoadly. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generatePasswordResetTemplate(userName, resetLink) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu - DLoadly</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .header-text { color: white; font-size: 18px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .greeting { color: #333; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            .title { color: #333; font-size: 26px; font-weight: bold; margin-bottom: 25px; text-align: center; }
            .message { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px; }
            .button-container { text-align: center; margin: 35px 0; }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                padding: 18px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                font-size: 18px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                transition: all 0.3s ease;
            }
            .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6); }
            .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px; }
            .danger-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; }
            .divider { height: 2px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); margin: 30px 0; border-radius: 1px; }
            .link-box { background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 DLoadly</div>
                <div class="header-text">Đặt lại mật khẩu</div>
            </div>

            <div class="content">
                <div class="greeting">Chào ${userName || 'bạn'}! 👋</div>
                <h1 class="title">Yêu cầu đặt lại mật khẩu</h1>

                <div class="message">
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản DLoadly của bạn.</p>
                    <p>Nếu đây là yêu cầu của bạn, vui lòng nhấp vào nút bên dưới để tạo mật khẩu mới:</p>
                </div>

                <div class="button-container">
                    <a href="${resetLink}" class="button">🔑 Đặt lại mật khẩu</a>
                </div>

                <div class="warning-box">
                    <p><strong>⚠️ Lưu ý bảo mật quan trọng:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                        <li>Chỉ sử dụng nếu bạn đã yêu cầu đặt lại mật khẩu</li>
                        <li>Không chia sẻ link này với bất kỳ ai</li>
                        <li>Sau khi đặt lại, link này sẽ vô hiệu hóa</li>
                    </ul>
                </div>

                <div class="divider"></div>

                <div class="message">
                    <p><strong>Nếu nút không hoạt động, copy và paste link sau vào trình duyệt:</strong></p>
                    <div class="link-box">${resetLink}</div>
                </div>

                <div class="danger-box">
                    <p><strong>🚨 Nếu bạn KHÔNG yêu cầu đặt lại mật khẩu:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>Bỏ qua email này</strong> - mật khẩu sẽ không thay đổi</li>
                        <li>Kiểm tra bảo mật tài khoản của bạn</li>
                        <li>Thay đổi mật khẩu nếu nghi ngờ bị xâm nhập</li>
                        <li>Liên hệ support nếu cần hỗ trợ</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p><strong>🔐 DLoadly - Bảo mật tài khoản</strong></p>
                <p>Bảo mật tài khoản là ưu tiên hàng đầu của chúng tôi</p>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        Email bảo mật từ hệ thống DLoadly
                    </p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        Vui lòng không trả lời email này
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate secure tokens
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new CustomAuthEmailService();
