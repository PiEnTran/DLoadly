import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaUpload, FaTrash, FaCheck, FaExclamationTriangle, FaUsers, FaLink,
  FaDatabase, FaDownload, FaCog, FaChartBar, FaUserCog,
  FaHistory, FaTachometerAlt, FaSun, FaMoon, FaSignOutAlt, FaHdd, FaPlay,
  FaCloudUploadAlt
} from 'react-icons/fa';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { userService, requestService, settingsService } from '../services/firebaseService';
import Header from '../components/Header';
import Footer from '../components/Footer';

import UserStorageManager from '../components/UserStorageManager';
import AdminPlatformManager from '../components/AdminPlatformManager';

const AdminPage = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    totalUsers: 0,
    totalDownloads: 0,
    storageUsed: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [settings, setSettings] = useState({
    dailyDownloadLimit: 10,
    maxFileSize: 500,
    fshareEmail: '',
    fsharePassword: '',
    googleDriveApiKey: '',
    enableFshareVip: false,
    enableGoogleDrive: true,
    // Platform settings
    enableYoutube: true,
    enableTiktok: true,
    enableInstagram: true,
    enableFacebook: true,
    enableTwitter: true,
    enableFshare: true,
    // Platform limits (requests per day)
    youtubeLimit: 100,
    tiktokLimit: 50,
    instagramLimit: 30,
    facebookLimit: 20,
    twitterLimit: 25,
    fshareLimit: 10,
    // Fshare bandwidth tracking (GB per day)
    fshareDailyBandwidthLimit: 150,
    fshareUsedBandwidthToday: 0,
    fshareLastResetDate: new Date().toISOString().split('T')[0]
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage] = useState(10);

  const { userRole, isAdmin, isSuperAdmin } = useRole();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchRequests();
    fetchUsers();
    fetchStats();
    fetchSettings();
    initializeSettings();

    // Set up real-time listeners
    setupRealTimeListeners();

    // Cleanup listeners on unmount
    return () => {
      // Cleanup Firebase listeners
      if (window.adminPageUnsubscribers) {
        if (window.adminPageUnsubscribers.requests) {
          window.adminPageUnsubscribers.requests();
        }
        if (window.adminPageUnsubscribers.users) {
          window.adminPageUnsubscribers.users();
        }
      }

      // Cleanup stats interval
      if (window.adminPageStatsInterval) {
        clearInterval(window.adminPageStatsInterval);
      }

      console.log('🧹 AdminPage cleanup completed');
    };
  }, []);

  // Setup real-time listeners for Firebase
  const setupRealTimeListeners = () => {
    // Real-time requests listener
    const unsubscribeRequests = requestService.onRequestsChange((updatedRequests) => {
      console.log('📡 Real-time update: Requests changed', updatedRequests.length);

      const formattedRequests = updatedRequests.map(req => ({
        _id: req.id,
        url: req.url,
        userName: req.userName || req.userEmail?.split('@')[0],
        userEmail: req.userEmail,
        userGmail: req.userEmail,
        userDisplayName: req.userName || req.userEmail?.split('@')[0],
        recipientEmail: req.recipientEmail,
        createdAt: req.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        status: req.status,
        fileSize: req.fileSize || 'N/A',
        platform: req.platform || 'Unknown',
        driveLink: req.driveLink,
        isManualProcessing: req.isManualProcessing,
        drivePermissions: req.drivePermissions
      }));

      setRequests(formattedRequests);

      // Auto-refresh stats when requests change
      fetchStats();
    });

    // Real-time users listener
    const unsubscribeUsers = userService.onUsersChange((updatedUsers) => {
      console.log('📡 Real-time update: Users changed', updatedUsers.length);

      const formattedUsers = updatedUsers.map(user => ({
        _id: user.id,
        name: user.name || user.email?.split('@')[0],
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        totalDownloads: user.totalDownloads || 0
      }));

      setUsers(formattedUsers);

      // Auto-refresh stats when users change
      fetchStats();
    });

    // Store unsubscribe functions for cleanup
    window.adminPageUnsubscribers = {
      requests: unsubscribeRequests,
      users: unsubscribeUsers
    };

    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing stats...');
      fetchStats();
    }, 30000);

    // Store interval for cleanup
    window.adminPageStatsInterval = statsInterval;
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await requestService.getAllRequests();

      if (result.success) {
        // Chuyển đổi dữ liệu Firestore sang format cũ để tương thích
        const formattedRequests = result.data.map(req => ({
          _id: req.id,
          url: req.url,
          userName: req.userName || req.userEmail?.split('@')[0],
          userEmail: req.userEmail,
          userGmail: req.userEmail, // Alias cho compatibility
          userDisplayName: req.userName || req.userEmail?.split('@')[0],
          recipientEmail: req.recipientEmail, // ✅ THÊM FIELD NÀY!
          createdAt: req.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          status: req.status,
          fileSize: req.fileSize || 'N/A',
          platform: req.platform || 'Unknown',
          driveLink: req.driveLink,
          isManualProcessing: req.isManualProcessing,
          drivePermissions: req.drivePermissions
        }));

        setRequests(formattedRequests);
      } else {
        toast.error('Không thể tải danh sách yêu cầu: ' + result.error);
        // Fallback to mock data nếu Firestore không hoạt động
        setRequests([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Không thể tải danh sách yêu cầu');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await userService.getAllUsers();

      if (result.success) {
        // Chuyển đổi dữ liệu Firestore sang format cũ để tương thích
        const formattedUsers = result.data.map(user => ({
          _id: user.id,
          name: user.name || user.email?.split('@')[0],
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          totalDownloads: user.totalDownloads || 0
        }));

        setUsers(formattedUsers);
      } else {
        toast.error('Không thể tải danh sách người dùng: ' + result.error);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    }
  };

  const fetchStats = async () => {
    try {
      const result = await requestService.getStats();

      if (result.success) {
        setStats(result.data);
      } else {
        toast.error('Không thể tải thống kê: ' + result.error);
        // Fallback stats
        setStats({
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          failedRequests: 0,
          totalUsers: 0,
          totalDownloads: 0,
          storageUsed: '0GB'
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Không thể tải thống kê');
    }
  };

  const fetchSettings = async () => {
    try {
      const result = await settingsService.getSettings();
      if (result.success) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const initializeSettings = async () => {
    try {
      await settingsService.initializeDefaultSettings();
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const result = await settingsService.updateSettings(settings);
      if (result.success) {
        toast.success('Đã lưu cài đặt thành công!');
      } else {
        toast.error('Không thể lưu cài đặt: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Calculate file size in GB
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    const fileSizeMB = file.size / (1024 * 1024);

    // Check if this would exceed Fshare bandwidth limit
    const remainingBandwidth = settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday;
    const bandwidthAfterUpload = settings.fshareUsedBandwidthToday + fileSizeGB;
    const bandwidthPercentage = (bandwidthAfterUpload / settings.fshareDailyBandwidthLimit) * 100;

    // Show file size and bandwidth impact
    if (fileSizeGB > remainingBandwidth) {
      toast.error(
        <div className="text-sm">
          <div className="font-medium mb-1">🚫 File quá lớn cho bandwidth còn lại!</div>
          <div className="text-xs text-gray-600">
            📁 File: {formatFileSize(file.size)}<br/>
            📊 Bandwidth còn lại: {remainingBandwidth.toFixed(2)}GB<br/>
            ⚠️ Cần: {fileSizeGB.toFixed(2)}GB<br/>
            💡 Vui lòng chọn file nhỏ hơn hoặc chờ reset bandwidth
          </div>
        </div>,
        { duration: 8000 }
      );
      setSelectedFile(null);
      return;
    }

    // Show bandwidth impact warning
    if (bandwidthPercentage >= 90) {
      toast.warning(
        <div className="text-sm">
          <div className="font-medium mb-1">⚠️ Upload này sẽ gần hết bandwidth!</div>
          <div className="text-xs text-gray-600">
            📁 File: {formatFileSize(file.size)}<br/>
            📊 Sau upload: {bandwidthAfterUpload.toFixed(2)}GB / {settings.fshareDailyBandwidthLimit}GB<br/>
            🎯 Sử dụng: {bandwidthPercentage.toFixed(1)}%<br/>
            💡 Còn lại: {(settings.fshareDailyBandwidthLimit - bandwidthAfterUpload).toFixed(2)}GB
          </div>
        </div>,
        { duration: 6000 }
      );
    } else if (fileSizeGB > 1) {
      // Show info for large files (> 1GB)
      toast.info(
        <div className="text-sm">
          <div className="font-medium mb-1">📊 Thông tin bandwidth</div>
          <div className="text-xs text-gray-600">
            📁 File: {formatFileSize(file.size)}<br/>
            📊 Sau upload: {bandwidthAfterUpload.toFixed(2)}GB / {settings.fshareDailyBandwidthLimit}GB<br/>
            🎯 Sử dụng: {bandwidthPercentage.toFixed(1)}%<br/>
            ✅ Bandwidth đủ để upload
          </div>
        </div>,
        { duration: 4000 }
      );
    }

    setSelectedFile(file);
  };

  const handleUpload = async (requestId) => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file để tải lên');
      return;
    }

    // Check file size (warn if > 100MB, block if > 500MB)
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 500) {
      toast.error('File quá lớn! Giới hạn tối đa là 500MB');
      return;
    }

    if (fileSizeMB > 100) {
      const confirmed = window.confirm(
        `File có kích thước ${fileSizeMB.toFixed(1)}MB. ` +
        'File lớn có thể mất nhiều thời gian để upload. Bạn có muốn tiếp tục?'
      );
      if (!confirmed) return;
    }

    // Tìm request để lấy thông tin user
    const request = requests.find(r => r._id === requestId);
    if (!request) {
      toast.error('Không tìm thấy thông tin yêu cầu');
      return;
    }

    setUploadingId(requestId);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Google Drive với quyền cho user cụ thể
      const response = await axios.post('/api/fshare/upload-to-drive', {
        fileName: selectedFile.name,
        fileData: base64,
        mimeType: selectedFile.type,
        userEmail: request.recipientEmail || request.userGmail || request.userEmail, // Email nhận file
        userName: request.userDisplayName || request.userName,
        requestId: requestId
      }, {
        timeout: 300000, // 5 minutes timeout for large files
        maxContentLength: 500 * 1024 * 1024, // 500MB
        maxBodyLength: 500 * 1024 * 1024 // 500MB
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        // Update request status with Google Drive links
        const updateData = {
          status: 'completed',
          completedAt: new Date()
        };

        // Chỉ thêm các field nếu chúng có giá trị
        if (response.data.data?.driveLink) {
          updateData.driveLink = response.data.data.driveLink;
        }
        if (response.data.data?.downloadLink) {
          updateData.downloadUrl = response.data.data.downloadLink;
        }
        if (selectedFile?.size) {
          updateData.fileSize = formatFileSize(selectedFile.size);
        }

        await requestService.updateRequest(requestId, updateData);

        // Update Fshare bandwidth usage
        const fileSizeGB = selectedFile.size / (1024 * 1024 * 1024);
        const newBandwidthUsage = settings.fshareUsedBandwidthToday + fileSizeGB;

        // Update settings with new bandwidth usage
        const updatedSettings = {
          ...settings,
          fshareUsedBandwidthToday: newBandwidthUsage
        };
        setSettings(updatedSettings);

        // Save bandwidth update to database
        try {
          await settingsService.updateSettings({
            fshareUsedBandwidthToday: newBandwidthUsage
          });

          // Show bandwidth update notification
          const remainingBandwidth = settings.fshareDailyBandwidthLimit - newBandwidthUsage;
          const usagePercentage = (newBandwidthUsage / settings.fshareDailyBandwidthLimit) * 100;

          toast.info(
            <div className="text-sm">
              <div className="font-medium mb-1">📊 Bandwidth đã cập nhật</div>
              <div className="text-xs text-gray-600">
                📁 File uploaded: {formatFileSize(selectedFile.size)}<br/>
                📊 Đã sử dụng: {newBandwidthUsage.toFixed(2)}GB / {settings.fshareDailyBandwidthLimit}GB<br/>
                🎯 Tỷ lệ: {usagePercentage.toFixed(1)}%<br/>
                💾 Còn lại: {remainingBandwidth.toFixed(2)}GB
              </div>
            </div>,
            { duration: 5000 }
          );
        } catch (bandwidthError) {
          console.error('Error updating bandwidth:', bandwidthError);
          toast.warning('File uploaded thành công nhưng không thể cập nhật bandwidth tracking');
        }

        // Hiển thị thông báo cho admin
        toast.success(`File đã được upload và chia sẻ với ${request.userGmail || request.userEmail}!`);

        // Hiển thị thông báo hướng dẫn cho user
        if (response.data.notification) {
          const notification = response.data.notification;
          const userFolder = response.data.data.userFolder;
          toast.success(
            <div className="text-sm">
              <div className="font-medium mb-2">✅ Đã gửi thông báo đến {notification.userName}</div>
              <div className="text-xs text-gray-600">
                📧 {notification.userEmail}<br/>
                📁 File: {response.data.data.fileName}<br/>
                🔗 <a href={notification.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Xem file
                </a><br/>
                {userFolder && (
                  <>
                    📂 <a href={userFolder.folderLink} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">
                      Xem folder user ({userFolder.isNew ? 'mới tạo' : 'đã tồn tại'})
                    </a><br/>
                  </>
                )}
                {response.data.data.emailSent ?
                  '📧 ✅ Email thông báo đã được gửi (có link folder)' :
                  '📧 ⚠️ Email chưa được cấu hình'
                }
              </div>
            </div>,
            { duration: 10000 }
          );
        }

        fetchRequests(); // Refresh the list
        setSelectedFile(null);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);

      let errorMessage = 'Không thể upload file';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - File quá lớn hoặc kết nối chậm';
      } else if (error.response?.status === 413) {
        errorMessage = 'File quá lớn để upload. Vui lòng chọn file nhỏ hơn 500MB';
      } else if (error.response?.status === 507) {
        errorMessage = 'Không đủ dung lượng lưu trữ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  // Helper function to convert file to base64
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

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const result = await requestService.deleteRequest(requestId);
      if (result.success) {
        toast.success('Đã xóa yêu cầu');
        fetchRequests();
        fetchStats(); // Cập nhật thống kê
      } else {
        toast.error('Không thể xóa yêu cầu: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Không thể xóa yêu cầu');
    }
  };

  const handleCleanupDuplicateUsers = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp các user duplicate? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setLoading(true);
      const result = await userService.cleanupDuplicateUsers();
      if (result.success) {
        toast.success(result.message);
        fetchUsers();
        fetchStats();
      } else {
        toast.error('Không thể dọn dẹp users: ' + result.error);
      }
    } catch (error) {
      console.error('Error cleaning up users:', error);
      toast.error('Không thể dọn dẹp users');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      const result = await requestService.updateRequest(requestId, {
        status: 'completed',
        completedAt: new Date()
      });

      if (result.success) {
        toast.success('Đã đánh dấu yêu cầu là hoàn thành');
        fetchRequests();
        fetchStats(); // Cập nhật thống kê
      } else {
        toast.error('Không thể đánh dấu yêu cầu là hoàn thành: ' + result.error);
      }
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error('Không thể đánh dấu yêu cầu là hoàn thành');
    }
  };

  const handleEditUserRole = (user) => {
    setEditingUser(user);
    setShowRoleModal(true);
  };

  const handleUpdateUserRole = async (newRole) => {
    if (!editingUser) return;

    try {
      const result = await userService.updateUser(editingUser._id, { role: newRole });
      if (result.success) {
        toast.success(`Đã cập nhật role của ${editingUser.name} thành ${newRole}`);
        setShowRoleModal(false);
        setEditingUser(null);
        fetchUsers();
        fetchStats();
      } else {
        toast.error('Không thể cập nhật role: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Không thể cập nhật role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const result = await userService.deleteUser(userId);
      if (result.success) {
        toast.success('Đã xóa người dùng');
        fetchUsers();
        fetchStats();
      } else {
        toast.error('Không thể xóa người dùng: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa người dùng');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Pagination helpers
  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength, itemsPerPage) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  const renderPagination = (currentPage, totalPages, setCurrentPage) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, requests.length)}
              </span>{' '}
              trong <span className="font-medium">{requests.length}</span> kết quả
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Trang trước</span>
                ‹
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Trang sau</span>
                ›
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Đang chờ
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Hoàn thành
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Không xác định
          </span>
        );
    }
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng Yêu Cầu</p>
              <p className="text-3xl font-bold">{stats.totalRequests}</p>
            </div>
            <FaLink className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Đang Chờ</p>
              <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            </div>
            <FaExclamationTriangle className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Hoàn Thành</p>
              <p className="text-3xl font-bold">{stats.completedRequests}</p>
            </div>
            <FaCheck className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Thất Bại</p>
              <p className="text-3xl font-bold">{stats.failedRequests}</p>
            </div>
            <FaTrash className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Tổng Người Dùng</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalUsers}</p>
            </div>
            <FaUsers className="h-6 w-6 text-indigo-500" />
          </div>
        </div>

        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Tổng Tải Xuống</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalDownloads}</p>
            </div>
            <FaDownload className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Dung Lượng Sử Dụng</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.storageUsed}</p>
            </div>
            <FaDatabase className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Google Drive</p>
              <p className={`text-2xl font-bold ${settings.enableGoogleDrive ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.enableGoogleDrive ? 'Đã kết nối' : 'Chưa kết nối'}
              </p>
            </div>
            <FaCloudUploadAlt className={`h-6 w-6 ${settings.enableGoogleDrive ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          {settings.enableGoogleDrive && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✅ Files được upload tự động
            </div>
          )}
        </div>
      </div>

      {/* Fshare Bandwidth Tracking */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📁</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                Fshare VIP Bandwidth
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Giới hạn hàng ngày: {settings.fshareDailyBandwidthLimit}GB
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">
              {(settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday).toFixed(1)}GB
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              còn lại
            </div>
          </div>
        </div>

        {/* Bandwidth Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400 mb-2">
            <span>Đã sử dụng: {settings.fshareUsedBandwidthToday.toFixed(1)}GB</span>
            <span>{((settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.9
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.7
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}
              style={{
                width: `${Math.min((settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {(settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.9 ? (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <span className="text-lg mr-2">🚫</span>
                <span className="text-sm font-medium">Sắp hết bandwidth!</span>
              </div>
            ) : (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.7 ? (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <span className="text-lg mr-2">⚠️</span>
                <span className="text-sm font-medium">Cần theo dõi bandwidth</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <span className="text-lg mr-2">✅</span>
                <span className="text-sm font-medium">Bandwidth khả dụng</span>
              </div>
            )}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Reset: {new Date(new Date(settings.fshareLastResetDate).getTime() + 24*60*60*1000).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Fshare Bandwidth Tracking */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📁</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                Fshare VIP Bandwidth
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Giới hạn hàng ngày: {settings.fshareDailyBandwidthLimit}GB
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">
              {(settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday).toFixed(1)}GB
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              còn lại
            </div>
          </div>
        </div>

        {/* Bandwidth Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400 mb-2">
            <span>Đã sử dụng: {settings.fshareUsedBandwidthToday.toFixed(1)}GB</span>
            <span>{((settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.9
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.7
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}
              style={{
                width: `${Math.min((settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {(settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.9 ? (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <span className="text-lg mr-2">🚫</span>
                <span className="text-sm font-medium">Sắp hết bandwidth!</span>
              </div>
            ) : (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) >= 0.7 ? (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <span className="text-lg mr-2">⚠️</span>
                <span className="text-sm font-medium">Cần theo dõi bandwidth</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <span className="text-lg mr-2">✅</span>
                <span className="text-sm font-medium">Bandwidth khả dụng</span>
              </div>
            )}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Reset: {new Date(new Date(settings.fshareLastResetDate).getTime() + 24*60*60*1000).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>🔥 Firebase Real-time:</strong> Dữ liệu được cập nhật trực tiếp từ Firestore.
              Tổng cộng <strong>{stats.totalUsers || 0} người dùng</strong> và <strong>{stats.totalRequests || 0} yêu cầu</strong> trong hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {stats.recentActivity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Hoạt Động Gần Đây</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">24 giờ qua:</span>
                <span className="font-medium text-[var(--text-primary)]">{stats.recentActivity.last24Hours} yêu cầu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">7 ngày qua:</span>
                <span className="font-medium text-[var(--text-primary)]">{stats.recentActivity.last7Days} yêu cầu</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Thống Kê Theo Platform</h3>
            <div className="space-y-3">
              {(() => {
                // Tính toán platform stats từ requests
                const platformCounts = {};
                const totalRequests = requests.length;

                // Khởi tạo tất cả platforms
                ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter', 'Fshare'].forEach(platform => {
                  platformCounts[platform] = 0;
                });

                // Đếm requests cho mỗi platform
                requests.forEach(request => {
                  const platform = request.platform || 'Unknown';
                  if (platformCounts.hasOwnProperty(platform)) {
                    platformCounts[platform]++;
                  } else {
                    platformCounts[platform] = 1;
                  }
                });

                return Object.entries(platformCounts)
                  .sort(([,a], [,b]) => b - a) // Sắp xếp theo số lượng giảm dần
                  .map(([platform, count]) => {
                    const percentage = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : 0;
                    const platformEmojis = {
                      'YouTube': '🎥',
                      'TikTok': '🎵',
                      'Instagram': '📸',
                      'Facebook': '👥',
                      'Twitter': '🐦',
                      'Fshare': '📁',
                      'Unknown': '❓'
                    };

                    return (
                      <div key={platform} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{platformEmojis[platform] || '📱'}</span>
                          <span className="text-[var(--text-secondary)] font-medium">{platform}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[var(--text-primary)]">{count}</span>
                          <span className="text-xs text-[var(--text-secondary)]">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  });
              })()}
              {requests.length === 0 && (
                <p className="text-[var(--text-secondary)] text-sm text-center py-4">Chưa có dữ liệu requests</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests */}
      <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Yêu Cầu Gần Đây</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-[var(--text-secondary)]">Đang tải...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Không có yêu cầu tải xuống nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-[var(--border-color)]">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Người Dùng
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Nền Tảng
                        </th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Kích Thước
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Trạng Thái
                        </th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Ngày Tạo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-[var(--border-color)]">
                      {requests.slice(0, 5).map((request) => (
                        <tr key={request._id} className="hover:bg-[var(--input-background)]">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-none">
                              {request.userName || 'Không xác định'}
                            </div>
                            <div className="text-xs sm:text-sm text-[var(--text-secondary)] truncate max-w-[120px] sm:max-w-none">
                              {request.userEmail}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {request.platform}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                            {request.fileSize}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                            {formatDate(request.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Requests Management Tab
  const renderRequests = () => (
    <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
      <div className="px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Quản Lý Yêu Cầu Tải Xuống</h3>
          <div className="flex space-x-4">
            {/* Platform Filter */}
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background)] text-[var(--text-primary)] text-sm"
            >
              <option value="all">Tất cả nền tảng ({requests.length})</option>
              {(() => {
                // Tính số requests cho mỗi platform
                const platformCounts = {};
                requests.forEach(request => {
                  const platform = request.platform || 'Unknown';
                  platformCounts[platform] = (platformCounts[platform] || 0) + 1;
                });

                return ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter', 'Fshare'].map(platform => (
                  <option key={platform} value={platform}>
                    {platform} ({platformCounts[platform] || 0})
                  </option>
                ));
              })()}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background)] text-[var(--text-primary)] text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-[var(--text-secondary)]">Đang tải...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <FaExclamationTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Không có yêu cầu tải xuống nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-[var(--border-color)]">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Người Dùng
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Nền Tảng
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Trạng Thái
                      </th>
                      <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Tải Lên Drive
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-[var(--border-color)]">
                    {getPaginatedData(
                      requests.filter(request => {
                        const matchesPlatform = filterPlatform === 'all' || request.platform === filterPlatform;
                        const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
                        return matchesPlatform && matchesStatus;
                      }),
                      currentPage,
                      itemsPerPage
                    ).map((request) => (
                      <tr key={request._id} className="hover:bg-[var(--input-background)]">
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-[var(--text-primary)]">
                          {request._id.substring(0, 8)}...
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <a
                            href={request.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs sm:text-sm block truncate max-w-[120px] sm:max-w-[200px]"
                            title={request.url}
                          >
                            {request.url.length > 30 ? request.url.substring(0, 30) + '...' : request.url}
                          </a>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate max-w-[100px] sm:max-w-none">
                            {request.userDisplayName || request.userName || 'Không xác định'}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] truncate max-w-[100px] sm:max-w-none">
                            {request.userGmail || request.userEmail}
                          </div>
                          {request.platform === 'Fshare' && request.isManualProcessing && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              🔧 Manual
                            </div>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {request.platform}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                      {request.platform === 'Fshare' && request.status !== 'completed' && (
                        <div className="space-y-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
                            <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                              <strong>👤 Thông tin người yêu cầu:</strong>
                            </p>
                            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                              <div>📧 <strong>Email gửi:</strong> {request.userGmail || request.userEmail}</div>
                              <div>👤 <strong>Tên:</strong> {request.userDisplayName || request.userName || 'Không xác định'}</div>
                              <div>📬 <strong>Email nhận file:</strong> <span className="font-semibold text-green-600">{request.recipientEmail || request.userGmail || request.userEmail}</span></div>
                              <div>🔗 <strong>URL:</strong> <a href={request.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{request.url}</a></div>
                            </div>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-2">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-2">
                              <strong>📥 Hướng dẫn xử lý:</strong>
                            </p>
                            <ol className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                              <li>1. Tải file từ Fshare bằng VIP account</li>
                              <li>2. Kéo thả file vào khung bên dưới</li>
                              <li>3. File sẽ tự động upload lên Google Drive</li>
                              <li>4. File sẽ được chia sẻ với email: <strong>{request.recipientEmail || request.userGmail || request.userEmail}</strong></li>
                              <li>5. User sẽ nhận thông báo truy cập Drive để tải xuống</li>
                            </ol>
                          </div>
                          <input
                            type="file"
                            className="block w-full text-sm text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                            onChange={handleFileChange}
                            disabled={uploadingId === request._id}
                          />

                          {/* File Size & Bandwidth Info */}
                          {selectedFile && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-green-600 dark:text-green-400 text-lg mr-2">📁</span>
                                  <div>
                                    <div className="text-sm font-medium text-green-800 dark:text-green-300">
                                      {selectedFile.name}
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      Kích thước: {formatFileSize(selectedFile.size)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-green-700 dark:text-green-400">
                                    📊 Bandwidth Impact
                                  </div>
                                  <div className="text-sm font-medium text-green-800 dark:text-green-300">
                                    +{(selectedFile.size / (1024 * 1024 * 1024)).toFixed(2)}GB
                                  </div>
                                </div>
                              </div>

                              {/* Bandwidth Preview */}
                              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                <div className="flex justify-between text-xs text-green-700 dark:text-green-400 mb-1">
                                  <span>Sau upload:</span>
                                  <span>
                                    {(settings.fshareUsedBandwidthToday + (selectedFile.size / (1024 * 1024 * 1024))).toFixed(2)}GB / {settings.fshareDailyBandwidthLimit}GB
                                  </span>
                                </div>
                                <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                                    style={{
                                      width: `${Math.min(((settings.fshareUsedBandwidthToday + (selectedFile.size / (1024 * 1024 * 1024))) / settings.fshareDailyBandwidthLimit) * 100, 100)}%`
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  Còn lại: {(settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday - (selectedFile.size / (1024 * 1024 * 1024))).toFixed(2)}GB
                                </div>
                              </div>
                            </div>
                          )}

                          <button
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            onClick={() => handleUpload(request._id)}
                            disabled={!selectedFile || uploadingId === request._id}
                          >
                            <FaUpload className="mr-2 h-4 w-4" />
                            Upload lên Drive
                          </button>
                          {uploadingId === request._id && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                      {request.platform !== 'Fshare' && request.status !== 'completed' && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Không cần xử lý thủ công
                        </span>
                      )}
                      {request.status === 'completed' && request.driveLink && (
                        <a
                          href={request.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <FaCloudUploadAlt className="mr-2 h-4 w-4" />
                          Xem trên Drive
                        </a>
                      )}
                    </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1 sm:space-x-2">
                            {request.status !== 'completed' && (
                              <button
                                className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                onClick={() => handleCompleteRequest(request._id)}
                                title="Đánh dấu hoàn thành"
                              >
                                <FaCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            )}
                            <button
                              className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              onClick={() => handleDeleteRequest(request._id)}
                              title="Xóa yêu cầu"
                            >
                              <FaTrash className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {(() => {
          const filteredRequests = requests.filter(request => {
            const matchesPlatform = filterPlatform === 'all' || request.platform === filterPlatform;
            const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
            return matchesPlatform && matchesStatus;
          });
          return filteredRequests.length > 0 && renderPagination(currentPage, getTotalPages(filteredRequests.length, itemsPerPage), setCurrentPage);
        })()}
      </div>
    </div>
  );

  // Render Users Management Tab
  const renderUsers = () => (
    <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
      <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Quản Lý Người Dùng</h3>
        <button
          onClick={handleCleanupDuplicateUsers}
          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
          disabled={loading}
        >
          <FaTrash className="mr-2 h-4 w-4" />
          Dọn Dẹp Duplicate
        </button>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-[var(--border-color)]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Người Dùng
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Vai Trò
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Tổng Tải Xuống
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Ngày Tham Gia
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-[var(--border-color)]">
                  {getPaginatedData(users, userCurrentPage, userItemsPerPage).map((user) => (
                    <tr key={user._id} className="hover:bg-[var(--input-background)]">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-xs sm:text-sm font-medium text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {user.name}
                            </div>
                            <div className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                        {user.totalDownloads}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditUserRole(user)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Chỉnh sửa vai trò"
                          >
                            <FaUserCog className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Xóa người dùng"
                          >
                            <FaTrash className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {users.length > 0 && renderPagination(userCurrentPage, getTotalPages(users.length, userItemsPerPage), setUserCurrentPage)}
      </div>
    </div>
  );

  // Render Platform Management Tab
  const renderPlatformManagement = () => {
    const platforms = [
      {
        id: 'youtube',
        name: 'YouTube',
        icon: '🎥',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        enabled: settings.enableYoutube,
        description: 'Tải video và audio từ YouTube',
        features: ['Video HD/4K', 'Audio MP3', 'Playlist support']
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        icon: '🎵',
        color: 'text-black dark:text-white',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        enabled: settings.enableTiktok,
        description: 'Tải video TikTok không watermark',
        features: ['Video HD', 'Không watermark', 'Audio riêng']
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        color: 'text-pink-500',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        borderColor: 'border-pink-200 dark:border-pink-800',
        enabled: settings.enableInstagram,
        description: 'Tải ảnh, video và stories từ Instagram',
        features: ['Photos HD', 'Videos', 'Stories', 'Reels']
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: '👥',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        enabled: settings.enableFacebook,
        description: 'Tải video từ Facebook',
        features: ['Video HD', 'Public posts', 'Watch videos']
      },
      {
        id: 'twitter',
        name: 'Twitter/X',
        icon: '🐦',
        color: 'text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        enabled: settings.enableTwitter,
        description: 'Tải video và GIF từ Twitter/X',
        features: ['Video HD', 'GIF', 'Images']
      },
      {
        id: 'fshare',
        name: 'Fshare',
        icon: '📁',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        enabled: settings.enableFshare,
        description: 'Tải file từ Fshare với tốc độ cao',
        features: ['VIP speed', 'All file types', 'Large files']
      }
    ];

    const handlePlatformToggle = (platformId) => {
      const settingKey = `enable${platformId.charAt(0).toUpperCase() + platformId.slice(1)}`;
      setSettings(prev => ({
        ...prev,
        [settingKey]: !prev[settingKey]
      }));
    };

    const enabledCount = platforms.filter(p => p.enabled).length;
    const totalRequests = requests.length;

    // Platform name mapping để đảm bảo matching chính xác
    const platformMapping = {
      'youtube': ['YouTube', 'youtube', 'YOUTUBE'],
      'tiktok': ['TikTok', 'tiktok', 'TIKTOK'],
      'instagram': ['Instagram', 'instagram', 'INSTAGRAM'],
      'facebook': ['Facebook', 'facebook', 'FACEBOOK'],
      'twitter': ['Twitter', 'twitter', 'TWITTER', 'X', 'x'],
      'fshare': ['Fshare', 'fshare', 'FSHARE']
    };

    const platformStats = platforms.map(platform => {
      const possibleNames = platformMapping[platform.id] || [platform.name];
      const platformRequests = requests.filter(r => {
        const requestPlatform = r.platform || '';
        return possibleNames.some(name =>
          requestPlatform.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(requestPlatform.toLowerCase())
        );
      }).length;

      // Debug log để kiểm tra
      if (platform.id === 'tiktok') {
        console.log('🔍 TikTok Debug:', {
          platformId: platform.id,
          possibleNames,
          totalRequests: requests.length,
          requestPlatforms: requests.map(r => r.platform),
          matchedRequests: platformRequests
        });
      }

      // Get platform limit
      const limitKey = `${platform.id}Limit`;
      const platformLimit = settings[limitKey] || 100;

      return {
        ...platform,
        requestCount: platformRequests,
        percentage: totalRequests > 0 ? ((platformRequests / totalRequests) * 100).toFixed(1) : 0,
        limit: platformLimit,
        limitPercentage: ((platformRequests / platformLimit) * 100).toFixed(1)
      };
    });

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Platforms Enabled</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{enabledCount}/{platforms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Total Requests</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-lg">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Most Popular</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {platformStats.sort((a, b) => b.requestCount - a.requestCount)[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Quản Lý Platforms</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Bật/tắt các platform và xem thống kê sử dụng
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformStats.map((platform) => (
                <div
                  key={platform.id}
                  className={`relative rounded-lg border-2 transition-all duration-200 ${
                    platform.enabled
                      ? `${platform.bgColor} ${platform.borderColor}`
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 opacity-60'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      platform.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {platform.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Platform Header */}
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">{platform.icon}</span>
                      <div>
                        <h4 className={`text-lg font-semibold ${platform.color}`}>
                          {platform.name}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {platform.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[var(--text-secondary)] flex items-center">
                          📊 Requests
                        </span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[var(--text-primary)]">
                            {platform.requestCount} / {platform.limit}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            ({platform.limitPercentage}% of limit)
                          </div>
                        </div>
                      </div>

                      {/* Limit Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            platform.enabled
                              ? platform.limitPercentage >= 100
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : platform.limitPercentage >= 80
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : platform.limitPercentage > 0
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(Math.max(platform.limitPercentage, 2), 100)}%` }}
                        ></div>
                      </div>

                      {/* Limit Controls */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--text-secondary)]">
                          🎯 Giới hạn hàng ngày:
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const limitKey = `${platform.id}Limit`;
                              const currentLimit = settings[limitKey] || 100;
                              if (currentLimit > 1) {
                                handleSettingChange(limitKey, currentLimit - 1);
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center text-xs font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={platform.limit}
                            onChange={(e) => {
                              const limitKey = `${platform.id}Limit`;
                              const newValue = Math.max(1, Math.min(1000, parseInt(e.target.value) || 1));
                              handleSettingChange(limitKey, newValue);
                            }}
                            className="w-16 px-2 py-1 text-xs text-center border border-[var(--border-color)] rounded bg-[var(--input-background)] text-[var(--text-primary)]"
                            min="1"
                            max="1000"
                          />
                          <button
                            onClick={() => {
                              const limitKey = `${platform.id}Limit`;
                              const currentLimit = settings[limitKey] || 100;
                              if (currentLimit < 1000) {
                                handleSettingChange(limitKey, currentLimit + 1);
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 flex items-center justify-center text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Status Messages */}
                      {platform.limitPercentage >= 100 && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                          🚫 Đã đạt giới hạn hàng ngày!
                        </div>
                      )}
                      {platform.limitPercentage >= 80 && platform.limitPercentage < 100 && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                          ⚠️ Sắp đạt giới hạn ({platform.limitPercentage}%)
                        </div>
                      )}
                      {platform.requestCount > 0 && platform.limitPercentage < 80 && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                          🔥 {platform.requestCount} requests đã sử dụng
                        </div>
                      )}
                      {platform.requestCount === 0 && platform.enabled && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                          ⏳ Chưa có requests nào (Limit: {platform.limit})
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <p className="text-xs text-[var(--text-secondary)] mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                        platform.enabled
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {platform.enabled ? '🔴 Disable' : '🟢 Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {settingsLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FaCog className="mr-2 h-5 w-5" />
                    Lưu Cài Đặt Platform
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Cài Đặt Hệ Thống</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Các cài đặt này sẽ được áp dụng cho toàn bộ hệ thống
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Download Limits */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Giới hạn tải xuống mỗi ngày
            </label>
            <input
              type="number"
              value={settings.dailyDownloadLimit}
              onChange={(e) => handleSettingChange('dailyDownloadLimit', parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
              max="1000"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Số lượng file tối đa mỗi user có thể tải xuống trong 1 ngày
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Kích thước file tối đa (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
              max="5000"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Kích thước file tối đa được phép tải xuống
            </p>
          </div>

          {/* Fshare Settings */}
          <div data-section="fshare">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Thông tin Fshare VIP
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableFshareVip}
                  onChange={(e) => handleSettingChange('enableFshareVip', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-[var(--text-secondary)]">Bật Fshare VIP</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email Fshare"
                value={settings.fshareEmail}
                onChange={(e) => handleSettingChange('fshareEmail', e.target.value)}
                disabled={!settings.enableFshareVip}
                className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
              <input
                type="password"
                placeholder="Mật khẩu Fshare"
                value={settings.fsharePassword}
                onChange={(e) => handleSettingChange('fsharePassword', e.target.value)}
                disabled={!settings.enableFshareVip}
                className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Tài khoản Fshare VIP để tải xuống với tốc độ cao
            </p>

            {/* Fshare Bandwidth Settings */}
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-3">
                📊 Quản Lý Bandwidth Fshare
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                    Giới hạn hàng ngày (GB)
                  </label>
                  <input
                    type="number"
                    value={settings.fshareDailyBandwidthLimit}
                    onChange={(e) => handleSettingChange('fshareDailyBandwidthLimit', parseFloat(e.target.value))}
                    className="block w-full px-2 py-1 text-sm border border-orange-300 dark:border-orange-700 rounded bg-white dark:bg-gray-800 text-orange-800 dark:text-orange-300"
                    min="1"
                    max="1000"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                    Đã sử dụng hôm nay (GB)
                  </label>
                  <input
                    type="number"
                    value={settings.fshareUsedBandwidthToday}
                    onChange={(e) => handleSettingChange('fshareUsedBandwidthToday', parseFloat(e.target.value))}
                    className="block w-full px-2 py-1 text-sm border border-orange-300 dark:border-orange-700 rounded bg-white dark:bg-gray-800 text-orange-800 dark:text-orange-300"
                    min="0"
                    max={settings.fshareDailyBandwidthLimit}
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                    Còn lại (GB)
                  </label>
                  <div className="px-2 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded text-orange-800 dark:text-orange-300 font-medium">
                    {(settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday).toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  📅 Reset hàng ngày lúc 00:00 (UTC+7)
                </div>
                <button
                  onClick={() => {
                    handleSettingChange('fshareUsedBandwidthToday', 0);
                    handleSettingChange('fshareLastResetDate', new Date().toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  🔄 Reset Bandwidth
                </button>
              </div>
            </div>
          </div>

          {/* Google Drive Settings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Google Drive API Key
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableGoogleDrive}
                  onChange={(e) => handleSettingChange('enableGoogleDrive', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-[var(--text-secondary)]">Bật Google Drive</span>
              </label>
            </div>
            <textarea
              rows="3"
              placeholder="Nhập Google Drive API Key..."
              value={settings.googleDriveApiKey}
              onChange={(e) => handleSettingChange('googleDriveApiKey', e.target.value)}
              disabled={!settings.enableGoogleDrive}
              className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              API Key để upload file lên Google Drive
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {settingsLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaCog className="mr-2 h-4 w-4" />
                  Lưu Cài Đặt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>⚙️ Trạng thái Services:</strong>
              Fshare VIP: <span className={settings.enableFshareVip ? 'text-green-600' : 'text-red-600'}>
                {settings.enableFshareVip ? 'Đã bật' : 'Tắt'}
              </span> |
              Google Drive: <span className={settings.enableGoogleDrive ? 'text-green-600' : 'text-red-600'}>
                {settings.enableGoogleDrive ? 'Đã bật' : 'Tắt'}
              </span>
            </p>
            <p className="text-sm text-green-800 dark:text-green-300 mt-1">
              <strong>🎯 Platforms:</strong>
              YouTube: <span className={settings.enableYoutube ? 'text-green-600' : 'text-red-600'}>
                {settings.enableYoutube ? 'ON' : 'OFF'}
              </span> |
              TikTok: <span className={settings.enableTiktok ? 'text-green-600' : 'text-red-600'}>
                {settings.enableTiktok ? 'ON' : 'OFF'}
              </span> |
              Instagram: <span className={settings.enableInstagram ? 'text-green-600' : 'text-red-600'}>
                {settings.enableInstagram ? 'ON' : 'OFF'}
              </span> |
              Facebook: <span className={settings.enableFacebook ? 'text-green-600' : 'text-red-600'}>
                {settings.enableFacebook ? 'ON' : 'OFF'}
              </span> |
              Twitter: <span className={settings.enableTwitter ? 'text-green-600' : 'text-red-600'}>
                {settings.enableTwitter ? 'ON' : 'OFF'}
              </span> |
              Fshare: <span className={settings.enableFshare ? 'text-green-600' : 'text-red-600'}>
                {settings.enableFshare ? 'ON' : 'OFF'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Trang Quản Trị
          </h1>
          <p className="text-[var(--text-secondary)]">
            Chào mừng {currentUser?.email}, bạn đang đăng nhập với vai trò: {userRole}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-[var(--border-color)]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaTachometerAlt className="inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaLink className="inline mr-2" />
              Yêu Cầu
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Người Dùng
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'storage'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaHdd className="inline mr-2" />
              Quản Lý Storage
            </button>
            <button
              onClick={() => setActiveTab('platforms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'platforms'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaPlay className="inline mr-2" />
              Nền Tảng
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              data-tab="settings"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
              }`}
            >
              <FaCog className="inline mr-2" />
              Cài Đặt
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'users' && renderUsers()}

          {activeTab === 'storage' && <UserStorageManager />}
          {activeTab === 'platforms' && renderPlatformManagement()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      <Footer />

      {/* Role Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-background)] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Chỉnh Sửa Vai Trò
            </h3>

            <div className="mb-4">
              <p className="text-[var(--text-secondary)] mb-2">
                Người dùng: <strong>{editingUser?.name}</strong>
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                Email: <strong>{editingUser?.email}</strong>
              </p>

              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Vai trò mới:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    defaultChecked={editingUser?.role === 'user'}
                    className="mr-2"
                  />
                  <span className="text-[var(--text-primary)]">User (Người dùng)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    defaultChecked={editingUser?.role === 'admin'}
                    className="mr-2"
                  />
                  <span className="text-[var(--text-primary)]">Admin (Quản trị viên)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 border border-[var(--border-color)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--input-background)]"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const selectedRole = document.querySelector('input[name="role"]:checked')?.value;
                  if (selectedRole) {
                    handleUpdateUserRole(selectedRole);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
