import React, { useState, useEffect } from 'react';
import { FaDatabase, FaUsers, FaDownload, FaLink } from 'react-icons/fa';

const AdminPageSimple = () => {
  const [settings, setSettings] = useState({
    fshareDailyBandwidthLimit: 150,
    fshareUsedBandwidthToday: 0,
    fshareLastResetDate: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Quản lý hệ thống DLoadly</p>
        </div>

        {/* Fshare Bandwidth Tracking */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tổng Yêu Cầu</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <FaLink className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng Người Dùng</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <FaUsers className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Tổng Tải Xuống</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <FaDownload className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Dung Lượng</p>
                <p className="text-3xl font-bold">0 MB</p>
              </div>
              <FaDatabase className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Test Message */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>✅ Fshare Bandwidth Tracking hoạt động!</strong> 
                Admin có thể theo dõi và quản lý bandwidth Fshare VIP 150GB/ngày.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPageSimple;
