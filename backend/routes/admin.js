const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const DownloadRequest = require('../models/DownloadRequest');
const { getGoogleDriveAuth } = require('../utils/googleDriveAuth');

// Đường dẫn đến thư mục tạm để lưu file tải lên
const tempDir = path.join(__dirname, '..', 'temp');

// Cấu hình multer để lưu file tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({ storage });

// Lấy danh sách yêu cầu tải xuống
router.get('/admin/requests', async (req, res) => {
  try {
    const requests = await DownloadRequest.find().sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching download requests:', error);
    return res.status(500).json({
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách yêu cầu tải xuống'
    });
  }
});

// Tạo yêu cầu tải xuống mới
router.post('/admin/requests', async (req, res) => {
  try {
    const { url, userName, userEmail } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL là bắt buộc' });
    }

    const newRequest = new DownloadRequest({
      url,
      userName,
      userEmail,
      status: 'pending'
    });

    await newRequest.save();

    return res.status(201).json({
      message: 'Đã tạo yêu cầu tải xuống thành công',
      request: newRequest
    });
  } catch (error) {
    console.error('Error creating download request:', error);
    return res.status(500).json({
      message: error.message || 'Đã xảy ra lỗi khi tạo yêu cầu tải xuống'
    });
  }
});

// Xóa yêu cầu tải xuống
router.delete('/admin/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DownloadRequest.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Đã xóa yêu cầu tải xuống thành công' });
  } catch (error) {
    console.error('Error deleting download request:', error);
    return res.status(500).json({
      message: error.message || 'Đã xảy ra lỗi khi xóa yêu cầu tải xuống'
    });
  }
});

// Đánh dấu yêu cầu là hoàn thành
router.put('/admin/requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await DownloadRequest.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    );
    return res.status(200).json({
      message: 'Đã đánh dấu yêu cầu là hoàn thành',
      request
    });
  } catch (error) {
    console.error('Error completing download request:', error);
    return res.status(500).json({
      message: error.message || 'Đã xảy ra lỗi khi đánh dấu yêu cầu là hoàn thành'
    });
  }
});

// Tải file lên Google Drive
router.post('/admin/upload-to-drive', upload.single('file'), async (req, res) => {
  try {
    const { requestId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    if (!requestId) {
      return res.status(400).json({ message: 'ID yêu cầu là bắt buộc' });
    }

    // Lấy thông tin yêu cầu
    const request = await DownloadRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tải xuống' });
    }

    // Cập nhật trạng thái
    request.status = 'processing';
    await request.save();

    // Lấy xác thực Google Drive
    const auth = await getGoogleDriveAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Tạo metadata cho file
    const fileMetadata = {
      name: file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    // Đọc file từ đĩa
    const fileStream = fs.createReadStream(file.path);

    // Upload file lên Google Drive
    const media = {
      mimeType: file.mimetype,
      body: fileStream
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,webContentLink'
    });

    console.log(`File uploaded to Google Drive: ${driveResponse.data.name} (ID: ${driveResponse.data.id})`);

    // Cập nhật quyền truy cập để bất kỳ ai có link đều có thể xem
    await drive.permissions.create({
      fileId: driveResponse.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Cập nhật thông tin yêu cầu
    request.status = 'completed';
    request.driveLink = driveResponse.data.webViewLink;
    request.fileName = file.originalname;
    request.fileSize = file.size;
    await request.save();

    // Xóa file tạm
    fs.unlinkSync(file.path);

    return res.status(200).json({
      message: 'Đã tải lên Google Drive thành công',
      driveLink: driveResponse.data.webViewLink,
      fileName: file.originalname,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return res.status(500).json({
      message: error.message || 'Đã xảy ra lỗi khi tải lên Google Drive'
    });
  }
});

// Mock platform statistics - in real app, this would come from database
const getPlatformStats = () => {
  const now = new Date();
  return {
    youtube: {
      requests: Math.floor(Math.random() * 1000) + 500,
      success: Math.floor(Math.random() * 900) + 450,
      failed: Math.floor(Math.random() * 100) + 20,
      lastRequest: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    },
    tiktok: {
      requests: Math.floor(Math.random() * 800) + 400,
      success: Math.floor(Math.random() * 750) + 350,
      failed: Math.floor(Math.random() * 80) + 15,
      lastRequest: new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000).toISOString()
    },
    instagram: {
      requests: Math.floor(Math.random() * 600) + 300,
      success: Math.floor(Math.random() * 550) + 250,
      failed: Math.floor(Math.random() * 70) + 10,
      lastRequest: new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000).toISOString()
    },
    facebook: {
      requests: Math.floor(Math.random() * 400) + 200,
      success: Math.floor(Math.random() * 300) + 150,
      failed: Math.floor(Math.random() * 150) + 50,
      lastRequest: new Date(now.getTime() - Math.random() * 18 * 60 * 60 * 1000).toISOString()
    },
    twitter: {
      requests: Math.floor(Math.random() * 300) + 150,
      success: Math.floor(Math.random() * 280) + 140,
      failed: Math.floor(Math.random() * 30) + 5,
      lastRequest: new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000).toISOString()
    },
    fshare: {
      requests: Math.floor(Math.random() * 100) + 50,
      success: Math.floor(Math.random() * 90) + 45,
      failed: Math.floor(Math.random() * 15) + 2,
      lastRequest: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString()
    }
  };
};

// GET /api/admin/platform-stats - Get platform statistics
router.get('/admin/platform-stats', (req, res) => {
  try {
    const stats = getPlatformStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform statistics'
    });
  }
});

// POST /api/admin/platform-toggle - Toggle platform enabled/disabled
router.post('/admin/platform-toggle', (req, res) => {
  try {
    const { platformId, enabled } = req.body;

    if (!platformId || typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    // In real app, this would update database
    console.log(`Platform ${platformId} ${enabled ? 'enabled' : 'disabled'}`);

    res.json({
      success: true,
      message: `Platform ${platformId} ${enabled ? 'enabled' : 'disabled'}`,
      platformId,
      enabled
    });
  } catch (error) {
    console.error('Error toggling platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle platform'
    });
  }
});

module.exports = router;
