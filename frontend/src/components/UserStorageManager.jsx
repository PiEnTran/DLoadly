import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import {
  FaUsers,
  FaHdd,
  FaEdit,
  FaSave,
  FaTimes,
  FaUserShield,
  FaUser,
  FaClock,
  FaChartBar
} from 'react-icons/fa';

const UserStorageManager = () => {
  const { currentUser } = useAuth();
  const { userRole, isAdmin } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    storageLimit: '',
    role: 'user'
  });

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <FaUserShield className="text-6xl text-red-300 dark:text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Truy Cập Bị Từ Chối
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Bạn cần quyền quản trị viên để truy cập tính năng này.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/downloads/admin/users', {
        headers: {
          'Authorization': `Bearer ${currentUser?.accessToken || 'demo'}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.userIP);
    setEditForm({
      storageLimit: user.storageLimit === -1 ? '-1' : (user.storageLimit / (1024 * 1024 * 1024)).toString(),
      role: user.role
    });
  };

  const handleSaveUser = async (userIP) => {
    try {
      const limitGB = editForm.storageLimit === '-1' ? -1 : parseFloat(editForm.storageLimit);

      if (limitGB !== -1 && (isNaN(limitGB) || limitGB < 0)) {
        toast.error('Giới hạn dung lượng không hợp lệ');
        return;
      }

      // Update storage limit
      const limitResponse = await fetch('/api/downloads/admin/set-user-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.accessToken || 'demo'}`
        },
        body: JSON.stringify({
          userIP,
          limitGB,
          userRole // Pass current user's role for authorization
        })
      });

      // Update role
      const roleResponse = await fetch('/api/downloads/admin/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.accessToken || 'demo'}`
        },
        body: JSON.stringify({
          userIP,
          role: editForm.role,
          userRole // Pass current user's role for authorization
        })
      });

      if (limitResponse.ok && roleResponse.ok) {
        toast.success('Cập nhật thành công!');
        setEditingUser(null);
        fetchUsers(); // Refresh list
      } else {
        toast.error('Không thể cập nhật người dùng');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Lỗi khi cập nhật người dùng');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      storageLimit: '',
      role: 'user'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa có hoạt động';
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Đang tải danh sách người dùng...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaUsers className="text-2xl text-blue-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Quản Lý Người Dùng
          </h2>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Làm Mới
        </button>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-8">
          <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Chưa có người dùng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold">IP Address</th>
                <th className="text-left py-3 px-4 font-semibold">Vai Trò</th>
                <th className="text-left py-3 px-4 font-semibold">Giới Hạn</th>
                <th className="text-left py-3 px-4 font-semibold">Đã Sử Dụng</th>
                <th className="text-left py-3 px-4 font-semibold">% Sử Dụng</th>
                <th className="text-left py-3 px-4 font-semibold">Downloads</th>
                <th className="text-left py-3 px-4 font-semibold">Hoạt Động Cuối</th>
                <th className="text-left py-3 px-4 font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userIP} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm">{user.userIP}</span>
                  </td>

                  <td className="py-3 px-4">
                    {editingUser === user.userIP ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {user.role === 'admin' ? <FaUserShield className="mr-1" /> : <FaUser className="mr-1" />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {editingUser === user.userIP ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editForm.storageLimit}
                          onChange={(e) => setEditForm({...editForm, storageLimit: e.target.value})}
                          placeholder="GB hoặc -1"
                          className="px-2 py-1 border rounded text-sm w-20"
                        />
                        <span className="text-xs text-gray-500">GB</span>
                      </div>
                    ) : (
                      <span className={`font-medium ${user.storageLimit === -1 ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {user.storageLimitFormatted}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium">{user.currentUsageFormatted}</span>
                  </td>

                  <td className="py-3 px-4">
                    {user.storageLimit === -1 ? (
                      <span className="text-green-600 font-medium">N/A</span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              user.usagePercentage > 90 ? 'bg-red-500' :
                              user.usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(user.usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{user.usagePercentage.toFixed(1)}%</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div>Tổng: {user.totalDownloads}</div>
                      <div className="text-gray-500">Hoạt động: {user.activeDownloads}</div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaClock className="mr-1" />
                      {formatDate(user.lastActivity)}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {editingUser === user.userIP ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveUser(user.userIP)}
                          className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                          title="Lưu"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Hủy"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Hướng dẫn:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• <strong>Giới hạn dung lượng:</strong> Nhập số GB (ví dụ: 5) hoặc -1 cho không giới hạn</li>
          <li>• <strong>Vai trò Admin:</strong> Có quyền không giới hạn dung lượng và quản lý người dùng khác</li>
          <li>• <strong>Vai trò User:</strong> Bị giới hạn dung lượng theo cài đặt</li>
          <li>• <strong>Mặc định:</strong> Người dùng mới có giới hạn 2GB</li>
        </ul>
      </div>
    </div>
  );
};

export default UserStorageManager;
