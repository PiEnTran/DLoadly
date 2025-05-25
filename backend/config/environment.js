const path = require('path');
const fs = require('fs');

class EnvironmentConfig {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isTest = process.env.NODE_ENV === 'test';

    // Load environment-specific config
    this.loadEnvironmentConfig();

    // Validate required variables
    this.validateRequiredVariables();
  }

  loadEnvironmentConfig() {
    // In production, rely only on environment variables
    // In development, load from .env file
    if (!this.isProduction) {
      require('dotenv').config();
    }
  }

  validateRequiredVariables() {
    const required = [
      'JWT_SECRET',
      'SESSION_SECRET',
      'COOKIE_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      console.warn('⚠️ Using default values for missing environment variables in production');

      // Set default values for missing variables
      if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = 'default-jwt-secret-change-in-production';
      }
      if (!process.env.SESSION_SECRET) {
        process.env.SESSION_SECRET = 'default-session-secret-change-in-production';
      }
      if (!process.env.COOKIE_SECRET) {
        process.env.COOKIE_SECRET = 'default-cookie-secret-change-in-production';
      }
    }
  }

  // Server Configuration
  get port() {
    return parseInt(process.env.PORT) || 5002;
  }

  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  }

  get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5174';
  }

  get corsOrigin() {
    if (this.isProduction) {
      return process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
    }
    return ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
  }

  // Security Configuration
  get jwtSecret() {
    return process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
  }

  get sessionSecret() {
    return process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';
  }

  get cookieSecret() {
    return process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-production';
  }

  get bcryptRounds() {
    return parseInt(process.env.BCRYPT_ROUNDS) || 12;
  }

  // Google Drive Configuration
  get googleDriveCredentials() {
    // First, try to parse JSON string from environment variable (both dev and prod)
    if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
      try {
        // Check if it's a JSON string
        if (process.env.GOOGLE_DRIVE_CREDENTIALS.startsWith('{')) {
          return JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
        }
        // If not JSON, treat as file path
        const fullPath = path.resolve(__dirname, '..', process.env.GOOGLE_DRIVE_CREDENTIALS);
        if (fs.existsSync(fullPath)) {
          return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        }
      } catch (error) {
        console.error('❌ Invalid Google Drive credentials:', error.message);
        return null;
      }
    }

    // Fallback: try default file path
    const defaultPath = path.resolve(__dirname, '..', 'config', 'google-credentials.json');
    if (fs.existsSync(defaultPath)) {
      try {
        return JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
      } catch (error) {
        console.error('❌ Error reading Google Drive credentials file:', error.message);
        return null;
      }
    }

    return null;
  }

  get googleDriveFolderId() {
    return process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  // Email Configuration
  get emailUser() {
    return process.env.EMAIL_USER;
  }

  get emailPassword() {
    return process.env.EMAIL_PASSWORD;
  }

  // Fshare Configuration
  get fshareEmail() {
    return process.env.FSHARE_EMAIL;
  }

  get fsharePassword() {
    return process.env.FSHARE_PASSWORD;
  }

  get fshareAppKey() {
    return process.env.FSHARE_APP_KEY;
  }

  get fshareToken() {
    return process.env.FSHARE_TOKEN;
  }

  get fshareCSRFToken() {
    return process.env.FSHARE_CSRF_TOKEN;
  }

  // Rate Limiting
  get rateLimitWindowMs() {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
  }

  get rateLimitMaxRequests() {
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  }

  // File Upload Configuration
  get maxFileSize() {
    return parseInt(process.env.MAX_FILE_SIZE) || 500;
  }

  get maxFileSizeMB() {
    return parseInt(process.env.MAX_FILE_SIZE_MB) || 100;
  }

  get tempFileCleanupHours() {
    return parseInt(process.env.TEMP_FILE_CLEANUP_HOURS) || 6;
  }

  // API Keys
  get rapidApiKey() {
    return process.env.RAPID_API_KEY;
  }

  // Validation methods
  isGoogleDriveConfigured() {
    return !!(this.googleDriveCredentials && this.googleDriveFolderId);
  }

  isEmailConfigured() {
    return !!(this.emailUser && this.emailPassword);
  }

  isFshareConfigured() {
    return !!(this.fshareEmail && this.fsharePassword);
  }

  // Get configuration summary
  getConfigSummary() {
    return {
      environment: this.nodeEnv,
      port: this.port,
      frontendUrl: this.frontendUrl,
      googleDrive: this.isGoogleDriveConfigured() ? 'Configured' : 'Not configured',
      email: this.isEmailConfigured() ? 'Configured' : 'Not configured',
      fshare: this.isFshareConfigured() ? 'Configured' : 'Not configured',
      security: {
        jwtSecret: this.jwtSecret ? 'Set' : 'Missing',
        sessionSecret: this.sessionSecret ? 'Set' : 'Missing',
        cookieSecret: this.cookieSecret ? 'Set' : 'Missing'
      }
    };
  }
}

module.exports = new EnvironmentConfig();
