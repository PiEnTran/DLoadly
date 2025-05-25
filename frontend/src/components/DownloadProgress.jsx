import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaCloudUploadAlt } from 'react-icons/fa';
import axios from 'axios';

const DownloadProgress = ({ downloadId, onComplete, onError }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('connecting');
  const [message, setMessage] = useState('Đang kết nối...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Kết nối Socket.IO khi component được tạo
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5002');
    setSocket(socketInstance);

    // Xử lý sự kiện kết nối
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setStatus('waiting');
      setMessage('Đang chuẩn bị tải xuống...');
    });

    // Xử lý sự kiện cập nhật tiến trình
    socketInstance.on('download_progress_update', (data) => {
      if (data.downloadId === downloadId) {
        console.log('Progress update:', data);
        if (data.progress) {
          setProgress(data.progress.progress || 0);
          setStatus(data.progress.status || 'downloading');
          setMessage(data.progress.message || 'Đang tải xuống...');
        }
      }
    });

    // Xử lý sự kiện hoàn thành
    socketInstance.on('download_complete', (data) => {
      if (data.downloadId === downloadId) {
        console.log('Download complete:', data);
        setProgress(100);
        setStatus('completed');
        setMessage('Tải xuống hoàn tất!');
        setResult(data.result);
        if (onComplete) onComplete(data.result);
      }
    });

    // Xử lý sự kiện lỗi
    socketInstance.on('download_error', (data) => {
      if (data.downloadId === downloadId) {
        console.log('Download error:', data);
        setStatus('error');
        setMessage(data.error.message || 'Đã xảy ra lỗi khi tải xuống');
        setError(data.error);
        if (onError) onError(data.error);
      }
    });

    // Yêu cầu cập nhật tiến trình ngay lập tức
    socketInstance.emit('get_download_progress', downloadId);

    // Thiết lập interval để yêu cầu cập nhật tiến trình định kỳ
    const progressInterval = setInterval(() => {
      socketInstance.emit('get_download_progress', downloadId);
    }, 2000);

    // Dọn dẹp khi component bị hủy
    return () => {
      clearInterval(progressInterval);
      socketInstance.disconnect();
    };
  }, [downloadId, onComplete, onError]);

  // Lấy tiến trình tải xuống từ API khi Socket.IO không hoạt động
  useEffect(() => {
    if (status === 'error' || status === 'completed') return;

    const fetchProgress = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/fshare/progress/${downloadId}`);
        
        if (response.data) {
          setProgress(response.data.progress || 0);
          setStatus(response.data.status || 'downloading');
          setMessage(response.data.message || 'Đang tải xuống...');
          
          if (response.data.status === 'completed' && onComplete) {
            onComplete(response.data);
          }
          
          if (response.data.status === 'error' && onError) {
            onError(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    // Chỉ sử dụng API fallback nếu Socket.IO không hoạt động
    if (!socket || !socket.connected) {
      const interval = setInterval(fetchProgress, 3000);
      return () => clearInterval(interval);
    }
  }, [downloadId, socket, status, onComplete, onError]);

  // Hiển thị icon tương ứng với trạng thái
  const renderStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'waiting':
      case 'downloading':
        return <FaSpinner className="animate-spin text-blue-500 h-8 w-8" />;
      case 'uploading':
        return <FaCloudUploadAlt className="text-purple-500 h-8 w-8" />;
      case 'completed':
        return <FaCheckCircle className="text-green-500 h-8 w-8" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500 h-8 w-8" />;
      default:
        return <FaSpinner className="animate-spin text-blue-500 h-8 w-8" />;
    }
  };

  // Hiển thị màu thanh tiến trình tương ứng với trạng thái
  const getProgressBarColor = () => {
    switch (status) {
      case 'connecting':
      case 'waiting':
      case 'downloading':
        return 'bg-blue-500';
      case 'uploading':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-xl mx-auto">
      <div className="flex items-center mb-4">
        {renderStatusIcon()}
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {status === 'completed' ? 'Tải xuống hoàn tất!' : 
             status === 'error' ? 'Lỗi tải xuống' : 
             status === 'uploading' ? 'Đang tải lên Google Drive' : 
             'Đang tải xuống từ Fshare'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
        <div 
          className={`h-4 rounded-full ${getProgressBarColor()}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-right text-sm text-gray-600 dark:text-gray-400">
        {progress}% hoàn thành
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <p className="font-medium">Lỗi: {error.message}</p>
        </div>
      )}
    </div>
  );
};

export default DownloadProgress;
