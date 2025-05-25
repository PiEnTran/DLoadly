import { useState, useEffect } from 'react';
import {
  FaUser, FaEnvelope, FaCalendarAlt, FaDownload, FaEdit, FaSave, FaTimes,
  FaShieldAlt, FaHistory, FaChartBar, FaCog, FaSignOutAlt, FaUserCircle,
  FaTrash, FaRedo, FaClock, FaVideo, FaMusic, FaImage, FaFile, FaHdd,
  FaCloudDownloadAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { userService, requestService } from '../services/firebaseService';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const { userRole } = useRole();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userStats, setUserStats] = useState({
    totalDownloads: 0,
    recentDownloads: [],
    joinDate: null
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });

  // Download management states
  const [activeTab, setActiveTab] = useState('profile');
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [downloadStats, setDownloadStats] = useState(null);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      fetchUserStats();
      setEditForm({
        name: currentUser.name || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'downloads') {
      fetchDownloadHistory();
      fetchDownloadStats();
    }
  }, [activeTab]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);

      // Lấy thống kê downloads của user
      const requestsResult = await requestService.getAllRequests();
      if (requestsResult.success) {
        const userRequests = requestsResult.data.filter(req => req.userId === currentUser.uid);
        const completedDownloads = userRequests.filter(req => req.status === 'completed');

        setUserStats({
          totalDownloads: completedDownloads.length,
          recentDownloads: userRequests.slice(0, 5), // 5 downloads gần nhất
          joinDate: currentUser.createdAt
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Không thể tải thống kê người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error('Tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      const result = await userService.updateUser(currentUser.uid, {
        name: editForm.name.trim()
      });

      if (result.success) {
        toast.success('Cập nhật thông tin thành công!');
        setIsEditing(false);
        // Cập nhật currentUser trong context nếu cần
      } else {
        toast.error('Không thể cập nhật thông tin: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  // Download management functions
  const fetchDownloadHistory = async () => {
    try {
      setLoadingDownloads(true);
      const response = await fetch('/api/downloads/history', {
        headers: {
          'X-User-ID': currentUser?.uid || '' // Pass Firebase userID
        }
      });
      const data = await response.json();

      if (data.success) {
        setDownloadHistory(data.data);
      } else {
        toast.error('Không thể tải lịch sử tải xuống');
      }
    } catch (error) {
      console.error('Error fetching download history:', error);
      toast.error('Lỗi khi tải lịch sử');
    } finally {
      setLoadingDownloads(false);
    }
  };

  const fetchDownloadStats = async () => {
    try {
      const response = await fetch('/api/downloads/stats', {
        headers: {
          'X-User-ID': currentUser?.uid || '' // Pass Firebase userID
        }
      });
      const data = await response.json();

      if (data.success) {
        setDownloadStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching download stats:', error);
    }
  };

  const handleDeleteDownload = async (itemId) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return;

    try {
      const response = await fetch(`/api/downloads/${itemId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        setDownloadHistory(downloadHistory.filter(item => item._id !== itemId));
        setSelectedItems(selectedItems.filter(id => id !== itemId));
        toast.success('Đã xóa thành công!');
        fetchDownloadStats(); // Update stats
      } else {
        toast.error(data.message || 'Không thể xóa');
      }
    } catch (error) {
      console.error('Error deleting download:', error);
      toast.error('Lỗi khi xóa');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một mục');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.length} mục đã chọn?`)) return;

    try {
      const response = await fetch('/api/downloads/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedItems })
      });
      const data = await response.json();

      if (data.success) {
        setDownloadHistory(downloadHistory.filter(item => !selectedItems.includes(item._id)));
        setSelectedItems([]);
        toast.success(data.message);
        fetchDownloadStats(); // Update stats
      } else {
        toast.error(data.message || 'Không thể xóa');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Lỗi khi xóa hàng loạt');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Bạn có chắc muốn dọn dẹp các file cũ?')) return;

    try {
      const response = await fetch('/api/downloads/cleanup', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchDownloadHistory();
        fetchDownloadStats();
      } else {
        toast.error(data.message || 'Không thể dọn dẹp');
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast.error('Lỗi khi dọn dẹp');
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === downloadHistory.length
        ? []
        : downloadHistory.map(item => item._id)
    );
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video': return <FaVideo className="text-blue-500" />;
      case 'audio': return <FaMusic className="text-green-500" />;
      case 'image': return <FaImage className="text-purple-500" />;
      default: return <FaFile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'Không xác định';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Đang chờ
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Hoàn thành
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Không xác định
          </span>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--main-background)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Vui lòng đăng nhập
          </h2>
          <p className="text-[var(--text-secondary)]">
            Bạn cần đăng nhập để xem trang hồ sơ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center w-full sm:w-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mr-4 sm:mr-6 flex-shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <FaUserCircle />}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2 truncate">
                    {currentUser.name || currentUser.email?.split('@')[0] || 'Người dùng'}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center">
                      <FaEnvelope className="mr-2 h-4 w-4" />
                      {currentUser.email}
                    </div>
                    <div className="flex items-center">
                      <FaShieldAlt className="mr-2 h-4 w-4" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userRole === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {userRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-[var(--border-color)] rounded-md text-[var(--text-primary)] bg-[var(--card-background)] hover:bg-[var(--input-background)] transition-colors"
                  >
                    <FaEdit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <FaSave className="mr-2 h-4 w-4" />
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: currentUser.name || currentUser.email?.split('@')[0] || '',
                          email: currentUser.email || ''
                        });
                      }}
                      className="inline-flex items-center px-4 py-2 border border-[var(--border-color)] rounded-md text-[var(--text-secondary)] bg-[var(--card-background)] hover:bg-[var(--input-background)]"
                    >
                      <FaTimes className="mr-2 h-4 w-4" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nhập tên của bạn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      disabled
                      className="block w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)] text-[var(--input-text)] opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Email không thể thay đổi
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] mb-6">
            <div className="flex border-b border-[var(--border-color)]">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition-colors flex items-center ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-secondary)] hover:text-indigo-500'
                }`}
              >
                <FaUser className="mr-2" />
                Thông Tin Cá Nhân
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-6 py-4 font-medium transition-colors flex items-center ${
                  activeTab === 'downloads'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-secondary)] hover:text-indigo-500'
                }`}
              >
                <FaHistory className="mr-2" />
                Lịch Sử Tải Xuống
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 font-medium transition-colors flex items-center ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-secondary)] hover:text-indigo-500'
                }`}
              >
                <FaChartBar className="mr-2" />
                Thống Kê
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaDownload className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Tổng tải xuống
                  </p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {userStats.totalDownloads}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaCalendarAlt className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Ngày tham gia
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatDate(userStats.joinDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaChartBar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Vai trò
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {userRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Downloads */}
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)]">
            <div className="px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center">
                <FaHistory className="mr-2 h-5 w-5" />
                Lịch sử tải xuống gần đây
              </h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-[var(--text-secondary)]">Đang tải...</p>
                </div>
              ) : userStats.recentDownloads.length === 0 ? (
                <div className="text-center py-8">
                  <FaDownload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">Chưa có lịch sử tải xuống</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-2">
                    Hãy thử tải xuống một số nội dung để xem lịch sử ở đây
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userStats.recentDownloads.map((download, index) => (
                    <div key={download.id || index} className="flex items-center justify-between p-4 bg-[var(--input-background)] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {download.platform?.charAt(0) || 'D'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {download.url?.length > 50 ? download.url.substring(0, 50) + '...' : download.url}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-[var(--text-secondary)]">
                                {download.platform || 'Unknown'}
                              </span>
                              <span className="text-xs text-[var(--text-tertiary)]">•</span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {formatDate(download.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(download.status)}
                        {download.status === 'completed' && download.driveLink && (
                          <a
                            href={download.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Mở link tải xuống"
                          >
                            <FaDownload className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {userStats.recentDownloads.length >= 5 && (
                    <div className="text-center pt-4">
                      <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                        Xem tất cả lịch sử tải xuống →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="mt-6 bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
              <FaCog className="mr-2 h-5 w-5" />
              Tài khoản
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--input-background)] rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">Đăng xuất</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Đăng xuất khỏi tài khoản của bạn</p>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  <FaSignOutAlt className="mr-2 h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Downloads Tab */}
          {activeTab === 'downloads' && (
            <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                    >
                      <FaTrash className="mr-2" />
                      Xóa ({selectedItems.length})
                    </button>
                  )}

                  <button
                    onClick={handleCleanup}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                  >
                    <FaHdd className="mr-2" />
                    Dọn Dẹp
                  </button>
                </div>

                <button
                  onClick={fetchDownloadHistory}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  🔄 Làm Mới
                </button>
              </div>

              {/* Stats Cards */}
              {downloadStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaCloudDownloadAlt className="text-blue-500 text-xl mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tổng tải xuống</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{downloadStats.totalDownloads}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaFile className="text-green-500 text-xl mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Files hiện tại</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{downloadStats.fileCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaHdd className="text-purple-500 text-xl mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dung lượng</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {formatFileSize(downloadStats.totalSize)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaHdd className="text-orange-500 text-xl mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {downloadStats.isUnlimited ? 'Giới hạn' : 'Sử dụng'}
                        </p>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {downloadStats.isUnlimited ? 'Không giới hạn' : `${downloadStats.usagePercentage.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download History */}
              {loadingDownloads ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-2">Đang tải lịch sử...</span>
                </div>
              ) : downloadHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FaHistory className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Chưa có lịch sử tải xuống nào</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === downloadHistory.length}
                      onChange={toggleSelectAll}
                      className="mr-2"
                    />
                    <label className="text-sm text-[var(--text-secondary)]">
                      Chọn tất cả ({downloadHistory.length} mục)
                    </label>
                  </div>

                  {/* History Items */}
                  <div className="space-y-4">
                    {downloadHistory.map((item) => (
                      <div
                        key={item._id}
                        className={`border rounded-lg p-4 transition-colors ${
                          selectedItems.includes(item._id)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-[var(--border-color)]'
                        }`}
                      >
                        <div className="flex items-start space-x-4 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={() => toggleSelectItem(item._id)}
                            className="mt-1 flex-shrink-0"
                          />

                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-[var(--text-primary)] truncate">
                                  {item.title}
                                </h3>

                                <div className="flex items-center flex-wrap gap-2 mt-2 text-sm text-[var(--text-secondary)]">
                                  <span className="flex items-center flex-shrink-0">
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1">{item.type}</span>
                                  </span>

                                  <span className="flex items-center flex-shrink-0">
                                    <FaClock className="mr-1" />
                                    {formatDateTime(item.downloadedAt)}
                                  </span>

                                  {item.fileSize > 0 && (
                                    <span className="flex items-center flex-shrink-0">
                                      <FaHdd className="mr-1" />
                                      {formatFileSize(item.fileSize)}
                                    </span>
                                  )}

                                  {item.actualQuality && (
                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                                      📺 {item.actualQuality}
                                    </span>
                                  )}

                                  {item.watermarkFree === true && (
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                                      ✅ Không logo
                                    </span>
                                  )}

                                  {item.watermarkFree === false && (
                                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                                      ⚠️ Có thể có logo
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                                  {item.url}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <a
                                  href={item.downloadUrl}
                                  download={item.originalFilename}
                                  className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="Tải xuống"
                                >
                                  <FaDownload />
                                </a>

                                <button
                                  onClick={() => handleDeleteDownload(item._id)}
                                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="bg-[var(--card-background)] rounded-lg border border-[var(--border-color)] p-6">
              <h3 className="text-xl font-bold mb-6">Thống Kê Chi Tiết</h3>

              {downloadStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[var(--input-background)] p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 flex items-center">
                      <FaChartBar className="mr-2 text-blue-500" />
                      Thống Kê Tải Xuống
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Tổng số lượt tải:</span>
                        <span className="font-bold">{downloadStats.totalDownloads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Files đang lưu trữ:</span>
                        <span className="font-bold">{downloadStats.activeDownloads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Files trên disk:</span>
                        <span className="font-bold">{downloadStats.fileCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--input-background)] p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 flex items-center">
                      <FaHdd className="mr-2 text-purple-500" />
                      Thống Kê Dung Lượng
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Dung lượng sử dụng:</span>
                        <span className="font-bold">{formatFileSize(downloadStats.totalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giới hạn:</span>
                        <span className="font-bold">
                          {downloadStats.isUnlimited ? 'Không giới hạn' : formatFileSize(downloadStats.maxStorageSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phần trăm sử dụng:</span>
                        <span className="font-bold">
                          {downloadStats.isUnlimited ? 'N/A' : `${downloadStats.usagePercentage.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vai trò:</span>
                        <span className={`font-bold ${downloadStats.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`}>
                          {downloadStats.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {!downloadStats.isUnlimited && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(downloadStats.usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {downloadStats.isUnlimited && (
                        <div className="mt-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            ♾️ Dung lượng không giới hạn
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
