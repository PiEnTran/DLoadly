const { google } = require('googleapis');
const path = require('path');

/**
 * Tạo và trả về một đối tượng xác thực Google Drive
 * @returns {Promise<any>} Đối tượng xác thực Google Drive
 */
async function getGoogleDriveAuth() {
  try {
    // Tạo đối tượng xác thực từ file credentials
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'config', 'google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    return auth;
  } catch (error) {
    console.error('Error creating Google Drive auth:', error);
    throw new Error('Failed to create Google Drive auth: ' + error.message);
  }
}

module.exports = {
  getGoogleDriveAuth
};
