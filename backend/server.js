const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment configuration
const config = require('./config/environment');

const app = express();
const PORT = config.port;

// Environment check
const isProduction = config.isProduction;

console.log('🚀 Starting DLoadly Production Server v2.0...');

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server info
  res.removeHeader('X-Powered-By');

  next();
});

// CORS middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with validation
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    // Basic JSON validation for non-empty requests
    if (buf.length > 0) {
      try {
        JSON.parse(buf);
      } catch (e) {
        const error = new Error('Invalid JSON');
        error.status = 400;
        throw error;
      }
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom download route with proper headers
app.get('/temp/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'temp', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get original filename from query parameter
    const originalFilename = req.query.filename || filename;

    // Determine MIME type based on file extension
    const ext = path.extname(originalFilename).toLowerCase();
    let mimeType = 'application/octet-stream';

    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };

    if (mimeTypes[ext]) {
      mimeType = mimeTypes[ext];
    }

    // Set headers to force download
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

    console.log(`File download started: ${originalFilename}`);
  } catch (error) {
    console.error('Download route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Debug endpoint for CORS configuration
app.get('/api/debug/cors', (req, res) => {
  console.log('CORS debug request received');
  try {
    res.status(200).json({
      corsOrigin: config.corsOrigin,
      frontendUrl: config.frontendUrl,
      envVars: {
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        FRONTEND_URL: process.env.FRONTEND_URL,
        NODE_ENV: process.env.NODE_ENV
      },
      isProduction: config.isProduction
    });
  } catch (error) {
    console.error('CORS debug error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Simple root endpoint for debugging
app.get('/', (req, res) => {
  res.json({
    message: 'DLoadly Backend is running!',
    timestamp: new Date().toISOString(),
    health: '/api/health'
  });
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('Temp directory created:', tempDir);
} else {
  console.log('Temp directory exists:', tempDir);
}

// Check if temp directory is writable
try {
  const testFile = path.join(tempDir, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('Temp directory is writable');
} catch (error) {
  console.error('Temp directory is not writable:', error.message);
}

// Initialize services
console.log('Using Firebase for data storage - MongoDB not needed');

// Initialize Google Drive service
const googleDriveService = require('./services/googleDriveService');
const initializeGoogleDrive = async () => {
  try {
    if (config.isGoogleDriveConfigured()) {
      const credentials = config.googleDriveCredentials;
      const success = await googleDriveService.initializeWithCredentials(credentials);
      if (success) {
        console.log('✅ Google Drive: Connected');
      } else {
        console.log('❌ Google Drive: Failed to initialize');
      }
    } else {
      console.log('No Google Drive credentials provided - files will be stored locally');
    }
  } catch (error) {
    console.log('❌ Google Drive initialization error:', error.message);
  }
};

// Initialize Google Drive
initializeGoogleDrive();

// Load routes
console.log('Loading routes...');
try {
  // Load routes one by one with error handling
  try {
    const downloadRoutes = require('./routes/download');
    app.use('/api', downloadRoutes);
    console.log('✅ Download routes loaded');
  } catch (err) {
    console.log('⚠️ Download routes failed:', err.message);
  }

  try {
    const downloadsRoutes = require('./routes/downloads');
    app.use('/api', downloadsRoutes);
    console.log('✅ Downloads routes loaded');
  } catch (err) {
    console.log('⚠️ Downloads routes failed:', err.message);
  }

  try {
    const adminRoutes = require('./routes/admin');
    app.use('/api', adminRoutes);
    console.log('✅ Admin routes loaded');
  } catch (err) {
    console.log('⚠️ Admin routes failed:', err.message);
  }

  try {
    const googleDriveRoutes = require('./routes/googleDrive');
    app.use('/api', googleDriveRoutes);
    console.log('✅ Google Drive routes loaded');
  } catch (err) {
    console.log('⚠️ Google Drive routes failed:', err.message);
  }

  try {
    const fshareRoutes = require('./routes/fshare');
    app.use('/api', fshareRoutes);
    console.log('✅ Fshare routes loaded');
  } catch (err) {
    console.log('⚠️ Fshare routes failed:', err.message);
  }

  try {
    const customAuthRoutes = require('./routes/customAuth');
    app.use('/api/custom-auth', customAuthRoutes);
    console.log('✅ Custom Auth routes loaded');
  } catch (err) {
    console.log('⚠️ Custom Auth routes failed:', err.message);
  }

} catch (error) {
  console.error('Error loading routes:', error.message);
}

// Auto cleanup
const cleanupInterval = 6 * 60 * 60 * 1000; // 6 hours
setInterval(() => {
  console.log('Running auto cleanup...');
  // Add cleanup logic here
}, cleanupInterval);
console.log('Auto cleanup scheduled every 6 hours');

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ All services initialized successfully');
  console.log(`🚀 DLoadly Production Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔒 CORS Origin: ${Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin}`);
  console.log(`📧 Email: ${config.isEmailConfigured() ? 'Configured' : 'Not configured'}`);
  console.log(`☁️ Google Drive: ${config.isGoogleDriveConfigured() ? 'Connected' : 'Not connected'}`);
  console.log(`🔗 Fshare: ${config.isFshareConfigured() ? 'Configured' : 'Not configured'}`);
  console.log(`🎯 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: ${config.frontendUrl}`);
  console.log('');
  console.log('🎉 DLoadly is ready for production!');

  // Log configuration summary in development
  if (!isProduction) {
    console.log('\n📋 Configuration Summary:');
    console.table(config.getConfigSummary());
  }
});

module.exports = app;
