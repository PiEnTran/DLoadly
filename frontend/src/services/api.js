import axios from 'axios';
import environment from '../config/environment.js';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: environment.API_BASE_URL,
  timeout: 120000, // Increased to 2 minutes for video downloads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fshare API functions
export const fshareAPI = {
  // Download from Fshare
  download: async (url, password = '', targetEmail = '') => {
    const response = await api.post('/api/fshare/download', {
      url,
      password,
      targetEmail
    });
    return response.data;
  },

  // Get Fshare file info
  getFileInfo: async (url) => {
    const response = await api.post('/api/fshare/info', { url });
    return response.data;
  },

  // Get Fshare service status
  getStatus: async () => {
    const response = await api.get('/api/fshare/status');
    return response.data;
  },

  // Upload file to Google Drive (manual)
  uploadToDrive: async (fileName, fileData, mimeType, userEmail, userName, requestId) => {
    const response = await api.post('/api/fshare/upload-to-drive', {
      fileName,
      fileData,
      mimeType,
      userEmail,
      userName,
      requestId
    });
    return response.data;
  }
};

export default api;
