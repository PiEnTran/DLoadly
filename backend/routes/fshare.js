const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const googleDriveService = require('../services/googleDriveService');
const emailService = require('../services/emailService');
const fshareService = require('../services/fshareService');
const downloadManager = require('../services/downloadManager');

// Temp directory for downloads
const tempDir = path.join(__dirname, '..', 'temp');

// Helper to generate a unique filename
const generateUniqueFilename = (extension) => {
  return `${uuidv4()}.${extension}`;
};

// Download from Fshare and upload to Google Drive
router.post('/fshare/download', async (req, res) => {
  try {
    const { url, password = '', targetEmail = '', requestId } = req.body;

    console.log('Fshare download request:', url);

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Validate Fshare URL
    if (!fshareService.isFshareUrl(url)) {
      return res.status(400).json({ message: 'Invalid Fshare URL' });
    }

    // Check if Fshare service is configured
    if (!fshareService.isConfigured()) {
      return res.status(503).json({
        message: 'Fshare service is not configured or disabled',
        instructions: 'Vui lòng liên hệ quản trị viên để được hỗ trợ.'
      });
    }

    // Get quota info
    const quotaInfo = await fshareService.getQuotaInfo();
    if (!quotaInfo.enabled) {
      return res.status(503).json({
        message: 'Fshare service is not available',
        error: quotaInfo.error
      });
    }

    // Attempt to download using Fshare service
    const downloadResult = await fshareService.downloadFile(url, password, targetEmail);

    if (!downloadResult.success) {
      return res.status(500).json({
        message: 'Failed to download from Fshare',
        error: downloadResult.error || 'Unknown error'
      });
    }

    // Save to download history
    const userInfo = {
      userID: req.body.userID || req.ip || req.connection.remoteAddress,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    };

    await downloadManager.saveDownload({
      url,
      title: downloadResult.title,
      platform: 'fshare',
      filename: downloadResult.filename,
      originalFilename: downloadResult.filename,
      downloadUrl: downloadResult.downloadUrl,
      quality: 'original',
      actualQuality: 'Original',
      watermarkFree: true,
      type: downloadResult.type,
      duration: '',
      thumbnail: '',
      alternativeDownloads: []
    }, userInfo);

    // If targetEmail is provided, handle Google Drive upload
    if (targetEmail && googleDriveService.isInitialized()) {
      console.log('Target email provided, will upload to Google Drive and share');

      // For now, return instructions for manual upload
      // In a full implementation, you would download the file and upload to Drive
      return res.json({
        title: downloadResult.title,
        source: 'Fshare',
        type: 'Instructions',
        downloadUrl: null,
        filename: 'fshare_instructions.txt',
        instructions: `File Fshare sẽ được tải xuống và chia sẻ với email: ${targetEmail}\n\nThông tin file:\n- Tên: ${downloadResult.title}\n- Loại: ${downloadResult.type}\n- Link gốc: ${url}\n\nQuá trình xử lý:\n1. Tải xuống từ Fshare\n2. Upload lên Google Drive\n3. Chia sẻ với email đã cung cấp\n4. Gửi thông báo qua email\n\nVui lòng chờ email thông báo hoặc kiểm tra Google Drive.`,
        originalUrl: url,
        platform: 'fshare',
        targetEmail: targetEmail,
        quotaInfo: quotaInfo,
        requiresManualProcessing: true
      });
    } else {
      // Return direct download link
      return res.json({
        title: downloadResult.title,
        source: 'Fshare',
        type: downloadResult.type,
        downloadUrl: downloadResult.downloadUrl,
        filename: downloadResult.filename,
        fileSize: downloadResult.fileSize,
        instructions: downloadResult.instructions,
        originalUrl: url,
        platform: 'fshare',
        quotaInfo: quotaInfo,
        watermarkFree: true,
        message: 'File Fshare đã sẵn sàng để tải xuống!'
      });
    }

  } catch (error) {
    console.error('Fshare download error:', error);
    return res.status(500).json({
      message: error.message || 'An error occurred while processing Fshare download'
    });
  }
});

// Simulate Fshare download (replace with actual implementation)
async function simulateFshareDownload(url, fileId) {
  try {
    // This is a mock implementation
    // In reality, you would:
    // 1. Use Fshare API or web scraping to get download link
    // 2. Download the actual file
    // 3. Save it to temp directory

    console.log('Simulating Fshare download for:', fileId);

    // Generate a mock file for demonstration
    const fileName = `fshare_${fileId}`;
    const originalFileName = `${fileName}.txt`;
    const filePath = path.join(tempDir, generateUniqueFilename('txt'));

    // Create a mock file
    const mockContent = `This is a mock file downloaded from Fshare.\nFile ID: ${fileId}\nURL: ${url}\nDownloaded at: ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, mockContent);

    return {
      success: true,
      filePath: filePath,
      fileName: fileName,
      originalFileName: originalFileName,
      mimeType: 'text/plain',
      fileSize: mockContent.length,
      thumbnail: null
    };

  } catch (error) {
    console.error('Error in simulateFshareDownload:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Manual file upload to Google Drive (for drag & drop)
router.post('/fshare/upload-to-drive', async (req, res) => {
  try {
    const { fileName, fileData, mimeType, userEmail, userName, requestId } = req.body;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileData are required'
      });
    }

    console.log(`Processing upload for user: ${userName} (${userEmail}), Request ID: ${requestId}`);

    // Decode base64 file data and save to temp
    const buffer = Buffer.from(fileData, 'base64');
    const tempFileName = generateUniqueFilename(path.extname(fileName).slice(1) || 'bin');
    const tempFilePath = path.join(tempDir, tempFileName);

    fs.writeFileSync(tempFilePath, buffer);

    console.log(`Uploading manual file to Google Drive: ${fileName}`);

    // Sử dụng userEmail làm recipientEmail (sẽ được truyền từ frontend)
    const recipientEmail = userEmail;

    // Tạo hoặc lấy user folder
    const userFolderResult = await googleDriveService.createUserFolder(recipientEmail, userName);

    if (!userFolderResult.success) {
      throw new Error('Không thể tạo folder cho user: ' + userFolderResult.error);
    }

    console.log(`Using user folder: ${userFolderResult.folderName} (${userFolderResult.isNew ? 'new' : 'existing'})`);

    const uploadResult = await googleDriveService.uploadFile(
      tempFilePath,
      fileName,
      mimeType || 'application/octet-stream',
      {
        userEmail: recipientEmail,
        userName: userName,
        folderId: userFolderResult.folderId // Upload vào user folder
      }
    );

    // Delete temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (deleteError) {
      console.log('Failed to delete temp file:', deleteError.message);
    }

    if (uploadResult.success) {
      // Log successful upload with user info
      console.log(`File "${fileName}" uploaded successfully for ${userName} (${userEmail})`);
      console.log(`Drive Link: ${uploadResult.webViewLink}`);

      // Gửi email thông báo cho user với folder link
      const emailResult = await emailService.sendFileReadyNotification(
        userEmail,
        fileName,
        uploadResult.webViewLink,
        userName,
        userFolderResult.webViewLink // Thêm folder link
      );

      if (emailResult.success) {
        console.log(`Email notification sent to ${userEmail}`);
      } else {
        console.log(`Failed to send email notification: ${emailResult.error}`);
      }

      res.json({
        success: true,
        message: `File uploaded and shared with ${userEmail} successfully`,
        data: {
          fileName: fileName,
          downloadLink: uploadResult.downloadLink,
          driveLink: uploadResult.webViewLink,
          fileId: uploadResult.fileId,
          sharedWith: userEmail,
          requestId: requestId,
          emailSent: emailResult.success,
          userFolder: {
            folderId: userFolderResult.folderId,
            folderName: userFolderResult.folderName,
            folderLink: userFolderResult.webViewLink,
            isNew: userFolderResult.isNew
          }
        },
        notification: {
          userEmail: userEmail,
          userName: userName,
          message: `File "${fileName}" đã được upload lên Google Drive. ${emailResult.success ? 'Email thông báo đã được gửi.' : 'Vui lòng truy cập Drive để tải xuống.'}`,
          driveLink: uploadResult.webViewLink,
          emailNotification: emailResult.success,
          instructions: [
            '📁 Truy cập Google Drive của bạn',
            '🔍 Tìm file trong thư mục "Shared with me"',
            '📥 Click để tải xuống hoặc xem trực tuyến',
            '⚡ Tốc độ tải xuống cao từ Google Drive',
            emailResult.success ? '📧 Kiểm tra email để xem hướng dẫn chi tiết' : '📧 Email thông báo không khả dụng'
          ]
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to upload file to Google Drive',
        error: uploadResult.error
      });
    }

  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Get Fshare file info
router.post('/fshare/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !fshareService.isFshareUrl(url)) {
      return res.status(400).json({ message: 'Invalid Fshare URL' });
    }

    // Check if Fshare service is configured
    if (!fshareService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Fshare service is not configured or disabled'
      });
    }

    // Get file info using Fshare service
    const fileInfo = await fshareService.getFileInfo(url);
    const quotaInfo = await fshareService.getQuotaInfo();

    res.json({
      success: true,
      data: {
        fileId: fshareService.extractFileCode(url),
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileType: fileInfo.type,
        created: fileInfo.created,
        modified: fileInfo.modified,
        isFolder: fileInfo.isFolder,
        isAvailable: true
      },
      quotaInfo: quotaInfo,
      serviceStatus: fshareService.getServiceStatus()
    });

  } catch (error) {
    console.error('Error getting Fshare info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file info',
      error: error.message
    });
  }
});

// Get Fshare service status
router.get('/fshare/status', async (req, res) => {
  try {
    const status = fshareService.getServiceStatus();
    const quotaInfo = await fshareService.getQuotaInfo();

    res.json({
      success: true,
      status: status,
      quota: quotaInfo
    });
  } catch (error) {
    console.error('Error getting Fshare status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting service status',
      error: error.message
    });
  }
});

module.exports = router;
