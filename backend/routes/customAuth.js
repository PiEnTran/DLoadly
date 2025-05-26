const express = require('express');
const router = express.Router();
const customAuthEmailService = require('../services/customAuthEmailService');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'dloadly-301'
    });
  } catch (error) {
    console.log('Firebase Admin already initialized or error:', error.message);
  }
}

// Send custom email verification
router.post('/send-verification-email', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email là bắt buộc'
      });
    }

    // Debug email configuration
    console.log('🔍 Email Config Debug:', {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    });

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Email service not configured - EMAIL_USER or EMAIL_PASSWORD missing');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured - missing credentials'
      });
    }

    // Send custom verification email
    const result = await customAuthEmailService.sendEmailVerification(email, name);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email xác nhận đã được gửi thành công',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Không thể gửi email xác nhận'
      });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi gửi email xác nhận'
    });
  }
});

// Resend verification email
router.post('/resend-verification-email', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email là bắt buộc'
      });
    }

    // Resend verification email
    const result = await customAuthEmailService.resendEmailVerification(email, name);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email xác nhận đã được gửi lại thành công',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Không thể gửi lại email xác nhận'
      });
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi gửi lại email xác nhận'
    });
  }
});

// Verify email code (6 digits)
router.post('/verify-email-code', async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({
        success: false,
        error: 'Mã xác nhận và email là bắt buộc'
      });
    }



    // Verify code
    const verification = customAuthEmailService.verifyCode(code, email);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error
      });
    }

    try {
      // Get user by email from Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(verification.email);

      // Update email verification status in Firebase
      await admin.auth().updateUser(userRecord.uid, {
        emailVerified: true
      });

      // Remove the code after successful verification
      customAuthEmailService.removeToken(code);

      res.json({
        success: true,
        message: 'Email đã được xác nhận thành công! 🎉',
        email: verification.email,
        verifiedAt: new Date().toISOString()
      });

    } catch (firebaseError) {
      console.error('Firebase error during verification:', firebaseError);

      // If user not found in Firebase, still mark code as used
      customAuthEmailService.removeToken(code);

      res.json({
        success: true,
        message: 'Email đã được xác nhận thành công! 🎉',
        email: verification.email,
        verifiedAt: new Date().toISOString(),
        note: 'Verification completed but user may need to re-login'
      });
    }

  } catch (error) {
    console.error('Error verifying email code:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi xác nhận email'
    });
  }
});

// Verify email token (for backward compatibility)
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token là bắt buộc'
      });
    }

    // Verify token
    const verification = customAuthEmailService.verifyToken(token);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error
      });
    }

    try {
      // Get user by email from Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(verification.email);

      // Update email verification status in Firebase
      await admin.auth().updateUser(userRecord.uid, {
        emailVerified: true
      });

      // Remove the token after successful verification
      customAuthEmailService.removeToken(token);

      res.json({
        success: true,
        message: 'Email đã được xác nhận thành công',
        email: verification.email,
        verifiedAt: new Date().toISOString()
      });

    } catch (firebaseError) {
      console.error('Firebase error during verification:', firebaseError);

      // If user not found in Firebase, still mark token as used
      customAuthEmailService.removeToken(token);

      res.json({
        success: true,
        message: 'Email đã được xác nhận thành công',
        email: verification.email,
        verifiedAt: new Date().toISOString(),
        note: 'Verification completed but user may need to re-login'
      });
    }

  } catch (error) {
    console.error('Error verifying email token:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi xác nhận email'
    });
  }
});

// Check token status (for frontend to validate before showing verification page)
router.get('/check-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token là bắt buộc'
      });
    }

    const verification = customAuthEmailService.verifyToken(token);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error,
        expired: verification.error.includes('hết hạn')
      });
    }

    res.json({
      success: true,
      valid: true,
      email: verification.email,
      createdAt: verification.createdAt,
      expiresIn: Math.max(0, Math.floor((verification.expiresAt - Date.now()) / 1000 / 60)) // minutes remaining
    });

  } catch (error) {
    console.error('Error checking token:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi kiểm tra token'
    });
  }
});

// Get verification status for an email
router.get('/verification-status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email là bắt buộc'
      });
    }

    try {
      // Check Firebase Auth verification status
      const userRecord = await admin.auth().getUserByEmail(email);

      res.json({
        success: true,
        email: email,
        emailVerified: userRecord.emailVerified,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        creationTime: userRecord.metadata.creationTime
      });

    } catch (firebaseError) {
      if (firebaseError.code === 'auth/user-not-found') {
        res.status(404).json({
          success: false,
          error: 'Không tìm thấy người dùng với email này'
        });
      } else {
        throw firebaseError;
      }
    }

  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi kiểm tra trạng thái xác nhận'
    });
  }
});

module.exports = router;
