const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initialized = false;
    this.enabled = process.env.GOOGLE_DRIVE_ENABLED === 'true';
  }

  // Initialize Google Drive service with credentials
  async initialize(credentialsPath) {
    try {
      if (!fs.existsSync(credentialsPath)) {
        throw new Error('Google Drive credentials file not found');
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;

      console.log('Google Drive service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error.message);
      return false;
    }
  }

  // Initialize with JSON string (for environment variable)
  async initializeWithJson(credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;

      console.log('Google Drive service initialized successfully from JSON');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service from JSON:', error.message);
      return false;
    }
  }

  // Initialize with credentials object (for production environment variables)
  async initializeWithCredentials(credentials) {
    try {
      if (!credentials) {
        throw new Error('No credentials provided');
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;

      console.log('Google Drive service initialized successfully from credentials object');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service from credentials:', error.message);
      return false;
    }
  }

  // Upload file to Google Drive with specific folder and user permissions
  async uploadFile(filePath, fileName, mimeType = 'application/octet-stream', options = {}) {
    if (!this.enabled) {
      console.log('Google Drive service is disabled - storing files locally');
      return {
        success: false,
        error: 'Google Drive service is disabled',
        disabled: true,
        localStorageUsed: true
      };
    }

    if (!this.initialized) {
      console.log('Google Drive service not initialized - storing files locally');
      return {
        success: false,
        error: 'Google Drive service not initialized',
        notInitialized: true,
        localStorageUsed: true
      };
    }

    try {
      const { folderId, userEmail, userName } = options;

      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : [] // Upload to specific folder or root
      };

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
      };

      console.log(`Uploading file to Google Drive: ${fileName}`);
      if (folderId) console.log(`Target folder ID: ${folderId}`);
      if (userEmail) console.log(`Will share with user: ${userEmail}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,size'
      });

      const fileId = response.data.id;
      console.log(`File uploaded successfully: ${response.data.name} (ID: ${fileId})`);

      // Share with specific user if provided
      if (userEmail) {
        try {
          // Try sharing with notification first (for non-Google accounts)
          await this.drive.permissions.create({
            fileId: fileId,
            resource: {
              role: 'reader',
              type: 'user',
              emailAddress: userEmail
            },
            sendNotificationEmail: true // Enable notification for non-Google accounts
          });
          console.log(`File shared with user: ${userEmail}`);
        } catch (shareError) {
          console.error(`Error sharing file with ${userEmail}:`, shareError.message);
          // Try making file publicly accessible as fallback
          try {
            await this.drive.permissions.create({
              fileId: fileId,
              resource: {
                role: 'reader',
                type: 'anyone'
              }
            });
            console.log(`File made publicly accessible as fallback`);
          } catch (publicError) {
            console.error(`Error making file public:`, publicError.message);
          }
        }
      }

      return {
        success: true,
        fileId: fileId,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
        directLink: response.data.webContentLink,
        fileSize: response.data.size,
        sharedWith: userEmail || null
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload file from base64 data (for drag & drop uploads)
  async uploadFromBase64(base64Data, fileName, mimeType = 'application/octet-stream', options = {}) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const { folderId, userEmail, userName } = options;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : []
      };

      const media = {
        mimeType: mimeType,
        body: require('stream').Readable.from(buffer)
      };

      console.log(`Uploading file from base64 to Google Drive: ${fileName} (${buffer.length} bytes)`);
      if (folderId) console.log(`Target folder ID: ${folderId}`);
      if (userEmail) console.log(`Will share with user: ${userEmail}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,size'
      });

      const fileId = response.data.id;
      console.log(`File uploaded successfully: ${response.data.name} (ID: ${fileId})`);

      // Share with specific user if provided
      if (userEmail) {
        try {
          await this.drive.permissions.create({
            fileId: fileId,
            resource: {
              role: 'reader',
              type: 'user',
              emailAddress: userEmail
            },
            sendNotificationEmail: true
          });
          console.log(`File shared with user: ${userEmail}`);
        } catch (shareError) {
          console.error(`Error sharing file with ${userEmail}:`, shareError.message);
          // Try making file publicly accessible as fallback
          try {
            await this.drive.permissions.create({
              fileId: fileId,
              resource: {
                role: 'reader',
                type: 'anyone'
              }
            });
            console.log(`File made publicly accessible as fallback`);
          } catch (publicError) {
            console.error(`Error making file public:`, publicError.message);
          }
        }
      }

      return {
        success: true,
        fileId: fileId,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
        directLink: response.data.webContentLink,
        fileSize: response.data.size,
        sharedWith: userEmail || null
      };
    } catch (error) {
      console.error('Error uploading file from base64 to Google Drive:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a user-specific folder in Google Drive
  async createUserFolder(userEmail, userName = '') {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Tạo tên folder: "DLoadly - [UserName] ([Email])"
      const folderName = `DLoadly - ${userName || userEmail.split('@')[0]} (${userEmail})`;

      // Kiểm tra xem folder đã tồn tại chưa
      const existingFolders = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (existingFolders.data.files.length > 0) {
        console.log(`User folder already exists: ${folderName}`);
        return {
          success: true,
          folderId: existingFolders.data.files[0].id,
          folderName: folderName,
          webViewLink: `https://drive.google.com/drive/folders/${existingFolders.data.files[0].id}`,
          isNew: false
        };
      }

      // Tạo folder mới
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      // Share folder với user
      await this.drive.permissions.create({
        fileId: folder.data.id,
        resource: {
          role: 'reader',
          type: 'user',
          emailAddress: userEmail
        },
        sendNotificationEmail: false
      });

      console.log(`Created user folder: ${folderName} (ID: ${folder.data.id})`);

      return {
        success: true,
        folderId: folder.data.id,
        folderName: folderName,
        webViewLink: `https://drive.google.com/drive/folders/${folder.data.id}`,
        isNew: true
      };
    } catch (error) {
      console.error('Error creating user folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a folder in Google Drive
  async createFolder(folderName, parentFolderId = null) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      });

      console.log(`Folder created: ${response.data.name} (ID: ${response.data.id})`);

      return {
        success: true,
        folderId: response.data.id,
        folderName: response.data.name
      };
    } catch (error) {
      console.error('Error creating folder:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      console.log(`File deleted: ${fileId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get file info
  async getFileInfo(fileId) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,mimeType,createdTime,webViewLink,webContentLink'
      });

      return {
        success: true,
        file: response.data
      };
    } catch (error) {
      console.error('Error getting file info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List files in a folder
  async listFiles(folderId = null, pageSize = 10) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const query = folderId ? `'${folderId}' in parents` : '';

      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'files(id,name,size,mimeType,createdTime,webViewLink)'
      });

      return {
        success: true,
        files: response.data.files
      };
    } catch (error) {
      console.error('Error listing files:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if service is initialized
  isInitialized() {
    return this.initialized;
  }

  // Check if service is enabled
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
const googleDriveService = new GoogleDriveService();
module.exports = googleDriveService;
