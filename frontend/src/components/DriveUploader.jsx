import { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaSpinner, FaCheckCircle, FaTimes, FaFile } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const DriveUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(file => uploadFile(file));
    
    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.success);
      
      setUploadedFiles(prev => [...prev, ...successfulUploads]);
      
      if (successfulUploads.length === files.length) {
        toast.success(`Đã upload ${successfulUploads.length} file thành công!`);
      } else {
        toast.warning(`Upload thành công ${successfulUploads.length}/${files.length} file`);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi upload files');
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file) => {
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      const response = await axios.post('/api/fshare/upload-to-drive', {
        fileName: file.name,
        fileData: base64,
        mimeType: file.type
      });

      if (response.data.success) {
        return {
          success: true,
          fileName: file.name,
          size: file.size,
          downloadLink: response.data.data.downloadLink,
          driveLink: response.data.data.driveLink,
          fileId: response.data.data.fileId,
          uploadedAt: new Date()
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Lỗi upload ${file.name}: ${error.message}`);
      return {
        success: false,
        fileName: file.name,
        error: error.message
      };
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:mime/type;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép link!');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-[var(--text-primary)]">
              Đang upload lên Google Drive...
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaCloudUploadAlt className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Thả file vào đây hoặc click để chọn
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Hỗ trợ tất cả loại file. Files sẽ được upload lên Google Drive tự động.
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center">
              <FaCheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Files đã upload ({uploadedFiles.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[var(--input-background)] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaFile className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{file.fileName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(file.downloadLink)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50"
                    >
                      Copy Link
                    </button>
                    <a
                      href={file.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50"
                    >
                      View Drive
                    </a>
                    <button
                      onClick={() => removeUploadedFile(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          📋 Hướng dẫn sử dụng:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Kéo thả file vào khung upload hoặc click để chọn file</li>
          <li>• File sẽ được upload lên Google Drive tự động</li>
          <li>• Bạn sẽ nhận được link download và link Google Drive</li>
          <li>• Có thể upload nhiều file cùng lúc</li>
          <li>• Hỗ trợ tất cả loại file (video, audio, image, document, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default DriveUploader;
