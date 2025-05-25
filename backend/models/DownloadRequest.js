// Firebase-based Download Request model
class DownloadRequest {
  constructor(data) {
    this.url = data.url || '';
    this.userName = data.userName || '';
    this.userEmail = data.userEmail || '';
    this.status = data.status || 'pending';
    this.driveLink = data.driveLink || '';
    this.fileName = data.fileName || '';
    this.fileSize = data.fileSize || 0;
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Validate status
  static isValidStatus(status) {
    return ['pending', 'processing', 'completed', 'failed'].includes(status);
  }

  // Create new request
  static create(data) {
    return new DownloadRequest(data);
  }

  // Convert to plain object for Firebase
  toObject() {
    return {
      url: this.url,
      userName: this.userName,
      userEmail: this.userEmail,
      status: this.status,
      driveLink: this.driveLink,
      fileName: this.fileName,
      fileSize: this.fileSize,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = DownloadRequest;
