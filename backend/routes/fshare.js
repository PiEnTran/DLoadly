const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const googleDriveService = require('../services/googleDriveService');
const emailService = require('../services/emailService');

// Temp directory for downloads
const tempDir = path.join(__dirname, '..', 'temp');

// Helper to generate a unique filename
const generateUniqueFilename = (extension) => {
  return `${uuidv4()}.${extension}`;
};

// Download from Fshare and upload to Google Drive
router.post('/fshare/download', async (req, res) => {
  try {
    const { url, requestId } = req.body;

    console.log('Fshare download request:', url);

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Validate Fshare URL
    if (!url.includes('fshare.vn')) {
      return res.status(400).json({ message: 'Invalid Fshare URL' });
    }

    // Extract file ID from URL
    const fileIdMatch = url.match(/\/file\/([A-Z0-9]+)/i);
    if (!fileIdMatch) {
      return res.status(400).json({ message: 'Cannot extract file ID from URL' });
    }

    const fileId = fileIdMatch[1];
    console.log('Extracted file ID:', fileId);

    // For now, simulate Fshare download (you'll need to implement actual Fshare API)
    // This is a placeholder - replace with actual Fshare download logic
    const mockDownloadResult = await simulateFshareDownload(url, fileId);

    if (!mockDownloadResult.success) {
      return res.status(500).json({
        message: 'Failed to download from Fshare',
        error: mockDownloadResult.error
      });
    }

    // Check if Google Drive is enabled
    if (googleDriveService.isInitialized()) {
      console.log('Google Drive is enabled, uploading file...');

      const uploadResult = await googleDriveService.uploadFile(
        mockDownloadResult.filePath,
        mockDownloadResult.originalFileName,
        mockDownloadResult.mimeType
      );

      if (uploadResult.success) {
        console.log('File uploaded to Google Drive successfully');

        // Delete local file after successful upload
        try {
          fs.unlinkSync(mockDownloadResult.filePath);
          console.log('Local file deleted:', mockDownloadResult.filePath);
        } catch (deleteError) {
          console.log('Failed to delete local file:', deleteError.message);
        }

        return res.json({
          title: mockDownloadResult.fileName,
          thumbnail: mockDownloadResult.thumbnail,
          source: 'Fshare',
          type: 'File',
          downloadUrl: uploadResult.downloadLink,
          driveLink: uploadResult.webViewLink,
          filename: mockDownloadResult.originalFileName,
          originalUrl: url,
          isGoogleDrive: true,
          fileSize: mockDownloadResult.fileSize,
          message: 'File đã được tải xuống và upload lên Google Drive thành công!'
        });
      } else {
        console.log('Failed to upload to Google Drive, returning local file');
        // Fallback to local file if Drive upload fails
        return res.json({
          title: mockDownloadResult.fileName,
          thumbnail: mockDownloadResult.thumbnail,
          source: 'Fshare',
          type: 'File',
          downloadUrl: `/temp/${path.basename(mockDownloadResult.filePath)}`,
          filename: mockDownloadResult.originalFileName,
          originalUrl: url,
          isGoogleDrive: false,
          fileSize: mockDownloadResult.fileSize,
          message: 'File đã được tải xuống (Google Drive không khả dụng)'
        });
      }
    } else {
      console.log('Google Drive not initialized, returning local file');
      // Return local file if Google Drive is not configured
      return res.json({
        title: mockDownloadResult.fileName,
        thumbnail: mockDownloadResult.thumbnail,
        source: 'Fshare',
        type: 'File',
        downloadUrl: `/temp/${path.basename(mockDownloadResult.filePath)}`,
        filename: mockDownloadResult.originalFileName,
        originalUrl: url,
        isGoogleDrive: false,
        fileSize: mockDownloadResult.fileSize,
        message: 'File đã được tải xuống thành công!'
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

// Get Fshare file info (placeholder)
router.post('/fshare/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes('fshare.vn')) {
      return res.status(400).json({ message: 'Invalid Fshare URL' });
    }

    // Mock file info - replace with actual Fshare API call
    const fileIdMatch = url.match(/\/file\/([A-Z0-9]+)/i);
    const fileId = fileIdMatch ? fileIdMatch[1] : 'unknown';

    res.json({
      success: true,
      data: {
        fileId: fileId,
        fileName: `File_${fileId}`,
        fileSize: '10.5 MB',
        downloadCount: 1234,
        uploadDate: '2024-01-15',
        isAvailable: true
      }
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

module.exports = router;
