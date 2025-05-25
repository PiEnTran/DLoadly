const express = require('express');
const router = express.Router();
const googleDriveService = require('../services/googleDriveService');
const path = require('path');
const fs = require('fs');

// Test Google Drive connection
router.get('/google-drive/test', async (req, res) => {
  try {
    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    // Try to list files to test connection
    const result = await googleDriveService.listFiles(null, 1);

    if (result.success) {
      res.json({
        success: true,
        message: 'Google Drive connection successful',
        filesCount: result.files.length
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to connect to Google Drive',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing Google Drive connection',
      error: error.message
    });
  }
});

// Upload file to Google Drive
router.post('/google-drive/upload', async (req, res) => {
  try {
    const { filePath, fileName, mimeType } = req.body;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    if (!filePath || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'filePath and fileName are required'
      });
    }

    // Check if file exists
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log(`Uploading file to Google Drive: ${fullPath} -> ${fileName}`);

    const result = await googleDriveService.uploadFile(fullPath, fileName, mimeType);

    if (result.success) {
      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Upload file from temp directory
router.post('/google-drive/upload-temp', async (req, res) => {
  try {
    const { tempFileName, originalFileName, mimeType } = req.body;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    if (!tempFileName || !originalFileName) {
      return res.status(400).json({
        success: false,
        message: 'tempFileName and originalFileName are required'
      });
    }

    const tempPath = path.join(__dirname, '..', 'temp', tempFileName);

    if (!fs.existsSync(tempPath)) {
      return res.status(404).json({
        success: false,
        message: 'Temp file not found'
      });
    }

    console.log(`Uploading temp file to Google Drive: ${tempPath} -> ${originalFileName}`);

    const result = await googleDriveService.uploadFile(tempPath, originalFileName, mimeType);

    if (result.success) {
      // Optionally delete temp file after successful upload
      try {
        fs.unlinkSync(tempPath);
        console.log(`Deleted temp file: ${tempPath}`);
      } catch (deleteError) {
        console.log(`Failed to delete temp file: ${deleteError.message}`);
      }

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Create folder
router.post('/google-drive/create-folder', async (req, res) => {
  try {
    const { folderName, parentFolderId } = req.body;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: 'folderName is required'
      });
    }

    const result = await googleDriveService.createFolder(folderName, parentFolderId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Folder created successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create folder',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating folder',
      error: error.message
    });
  }
});

// List files
router.get('/google-drive/files', async (req, res) => {
  try {
    const { folderId, pageSize = 10 } = req.query;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    const result = await googleDriveService.listFiles(folderId, parseInt(pageSize));

    if (result.success) {
      res.json({
        success: true,
        message: 'Files retrieved successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve files',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: error.message
    });
  }
});

// Delete file
router.delete('/google-drive/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!googleDriveService.isInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive service not initialized'
      });
    }

    const result = await googleDriveService.deleteFile(fileId);

    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;
