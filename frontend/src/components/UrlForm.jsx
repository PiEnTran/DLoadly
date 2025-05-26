import { useState, useEffect } from 'react';
import { FaLink, FaSpinner, FaYoutube, FaTiktok, FaFacebook, FaInstagram, FaTwitter, FaDatabase, FaExclamationTriangle, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestService, userService } from '../services/firebaseService';
import { useSettings } from '../hooks/useSettings';
import DownloadProgress from './DownloadProgress';
import api from '../services/api';

const UrlForm = ({ url, setUrl, setMediaData, setLoading, setError }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlType, setUrlType] = useState(null);
  const [animateInput, setAnimateInput] = useState(false);
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [useFshareVip, setUseFshareVip] = useState(false);
  const [userName, setUserName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const { settings, checkDownloadLimit, checkFileSize } = useSettings();

  // Hàm phát hiện platform từ URL với validation
  const detectPlatform = (url) => {
    if (!url) return 'Unknown';

    const lowerUrl = url.toLowerCase();

    // YouTube detection với validation
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      if (lowerUrl.includes('watch?v=') || lowerUrl.includes('youtu.be/')) {
        return 'YouTube';
      }
    }
    // TikTok detection
    else if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) {
      return 'TikTok';
    }
    // Instagram detection với validation
    else if (lowerUrl.includes('instagram.com')) {
      if (lowerUrl.includes('/p/') || lowerUrl.includes('/reel/') || lowerUrl.includes('/tv/')) {
        return 'Instagram';
      }
    }
    // Facebook detection
    else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
      return 'Facebook';
    }
    // Twitter/X detection với validation
    else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      if (lowerUrl.includes('/status/')) {
        return 'Twitter';
      }
    }
    // Fshare detection với validation
    else if (lowerUrl.includes('fshare.vn')) {
      if (lowerUrl.includes('/file/')) {
        return 'Fshare';
      }
    }

    return 'Unknown';
  };

  // Khởi tạo thông tin user mặc định
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setUserName(currentUser.displayName || currentUser.email.split('@')[0]);
      setRecipientEmail(currentUser.email);
    }
  }, [isAuthenticated, currentUser]);

  // Function xử lý Fshare request với email đã chọn - AUTOMATIC DOWNLOAD
  const handleFshareRequest = async (email) => {
    if (!email || email.trim() === '') {
      toast.error('Vui lòng nhập email nhận file!');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email nhận file không hợp lệ!');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setShowEmailModal(false);

    let saveResult = null;

    try {
      // Lưu request vào Firestore trước
      const requestData = {
        url,
        userEmail: currentUser.email, // Email người gửi request
        userName: userName || currentUser.displayName || currentUser.email.split('@')[0],
        userId: currentUser.uid,
        platform: 'Fshare',
        useFshareVip,
        recipientEmail: email // Email nhận file (user nhập)
      };

      console.log('🔍 DEBUG - Request data:', requestData);
      console.log('🔍 DEBUG - Recipient email:', email);

      saveResult = await requestService.createRequest(requestData);

      if (!saveResult.success) {
        throw new Error('Không thể lưu yêu cầu: ' + saveResult.error);
      }

      const loadingToast = toast.loading('Đang tải xuống từ Fshare và upload lên Google Drive...');

      // Cập nhật request với trạng thái processing
      await requestService.updateRequest(saveResult.id, {
        status: 'processing',
        platform: 'Fshare',
        note: 'Đang tự động tải xuống từ Fshare và upload lên Google Drive',
        userGmail: currentUser.email,
        userDisplayName: userName || currentUser.displayName || currentUser.email.split('@')[0],
        recipientEmail: email,
        isManualProcessing: false
      });

      // Gọi API automatic download với targetEmail
      const response = await api.post('/download', {
        url,
        requestId: saveResult.id,
        userID: currentUser.uid,
        targetEmail: email, // Email nhận file
        password: '', // Có thể thêm password input sau
        platform: 'Fshare'
      });

      toast.dismiss(loadingToast);

      if (response.data.isAutomatic && response.data.uploadedToDrive) {
        // Automatic download thành công
        await requestService.updateRequest(saveResult.id, {
          status: 'completed',
          completedAt: new Date(),
          driveLink: response.data.downloadUrl,
          fileSize: response.data.fileSize,
          actualQuality: 'Original'
        });

        toast.success(
          <div className="text-sm">
            <div className="font-medium mb-1">✅ File đã được tải xuống và upload thành công!</div>
            <div className="text-xs text-gray-600">
              📁 File: <strong>{response.data.title}</strong><br/>
              ☁️ Đã upload lên Google Drive<br/>
              📧 Đã chia sẻ với email: <strong>{email}</strong><br/>
              📬 Email thông báo đã được gửi
            </div>
          </div>,
          { duration: 10000 }
        );

        // Hiển thị thông tin file đã hoàn thành
        setMediaData({
          title: response.data.title,
          source: 'Fshare',
          type: response.data.type,
          requestId: saveResult.id,
          status: 'completed',
          downloadUrl: response.data.downloadUrl,
          driveLink: response.data.downloadUrl,
          fileSize: response.data.fileSize,
          originalUrl: url,
          recipientEmail: email,
          isAutomatic: true,
          uploadedToDrive: true,
          instructions: [
            '✅ File đã được tải xuống từ Fshare thành công',
            '☁️ File đã được upload lên Google Drive',
            `📧 File đã được chia sẻ với email: ${email}`,
            '📬 Kiểm tra email để nhận thông báo',
            '🔗 Click vào link Google Drive để truy cập file'
          ]
        });
      } else if (response.data.isManualProcessing) {
        // Fallback to manual processing
        await requestService.updateRequest(saveResult.id, {
          status: 'pending',
          note: 'Automatic download failed, fallback to manual processing',
          isManualProcessing: true
        });

        toast.warning(
          <div className="text-sm">
            <div className="font-medium mb-1">⚠️ Chuyển sang xử lý thủ công</div>
            <div className="text-xs text-gray-600">
              🔄 Automatic download không thành công<br/>
              📧 Admin sẽ xử lý thủ công<br/>
              ⏱️ Thời gian xử lý: 5-30 phút
            </div>
          </div>,
          { duration: 8000 }
        );

        setMediaData({
          title: 'Yêu cầu tải xuống Fshare (Xử lý thủ công)',
          source: 'Fshare',
          type: 'Request',
          requestId: saveResult.id,
          status: 'pending',
          message: 'Automatic download không thành công. Admin sẽ xử lý thủ công.',
          originalUrl: url,
          recipientEmail: email,
          isManualProcessing: true,
          instructions: response.data.instructions || [
            '📝 Admin sẽ nhận được thông báo về yêu cầu của bạn',
            '📥 Admin sẽ tải file từ Fshare bằng tài khoản VIP',
            '☁️ File sẽ được upload lên Google Drive',
            `🔗 File sẽ được chia sẻ với email: ${email}`,
            '⏱️ Thời gian xử lý: 5-30 phút tùy kích thước file'
          ]
        });
      } else {
        throw new Error('Unexpected response format');
      }

      // Tăng số lần download của user
      await userService.incrementUserDownloads(currentUser.uid);

      setUrl('');
      setRecipientEmail('');
    } catch (error) {
      console.error('Error submitting Fshare request:', error);

      // Cập nhật request với trạng thái failed
      if (saveResult?.id) {
        await requestService.updateRequest(saveResult.id, {
          status: 'failed',
          error: error.message,
          failedAt: new Date()
        });
      }

      toast.error('Có lỗi xảy ra khi tải xuống: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Hiển thị thông báo đăng nhập khi có URL nhưng chưa đăng nhập
  useEffect(() => {
    if (url && !isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setShowLoginPrompt(false);
    }
  }, [url, isAuthenticated]);

  // Detect URL type for custom styling
  useEffect(() => {
    if (!url) {
      setUrlType(null);
      return;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        setUrlType('youtube');
      } else if (hostname.includes('tiktok.com')) {
        setUrlType('tiktok');
      } else if (hostname.includes('instagram.com')) {
        setUrlType('instagram');
      } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        setUrlType('facebook');
      } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        setUrlType('twitter');
      } else if (hostname.includes('fshare.vn')) {
        // Kiểm tra xem URL Fshare có đúng định dạng không
        if (urlObj.pathname.includes('/file/') && urlObj.pathname.split('/').length > 2) {
          // Lấy mã file và loại bỏ tham số query nếu có
          let fileCode = urlObj.pathname.split('/').pop();

          // Loại bỏ tham số query nếu có
          if (fileCode.includes('?')) {
            fileCode = fileCode.split('?')[0];
          }

          if (fileCode && fileCode.length > 5) {
            setUrlType('fshare');

            // Hiển thị thông báo nếu URL có tham số
            if (urlObj.search) {
              console.log('URL Fshare có tham số, sẽ được xử lý tự động');
            }
          } else {
            setUrlType('fshare-invalid');
          }
        } else {
          setUrlType('fshare-invalid');
        }
      } else {
        setUrlType('unknown');
      }
    } catch (error) {
      setUrlType(null);
    }
  }, [url]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setAnimateInput(true);
      setTimeout(() => setAnimateInput(false), 820);
      toast.error('Vui lòng nhập URL');
      return;
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch (error) {
      setAnimateInput(true);
      setTimeout(() => setAnimateInput(false), 820);
      toast.error('Vui lòng nhập URL hợp lệ');
      return;
    }

    // Kiểm tra trạng thái đăng nhập
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    // Kiểm tra giới hạn download hàng ngày
    if (!checkDownloadLimit(currentUser.totalDownloads || 0)) {
      toast.error(`Bạn đã đạt giới hạn ${settings.dailyDownloadLimit} lượt tải xuống mỗi ngày!`);
      return;
    }

    // Kiểm tra platform settings
    const platformChecks = {
      'youtube': settings.enableYoutube,
      'tiktok': settings.enableTiktok,
      'instagram': settings.enableInstagram,
      'facebook': settings.enableFacebook,
      'twitter': settings.enableTwitter,
      'fshare': settings.enableFshare
    };

    if (urlType && platformChecks.hasOwnProperty(urlType) && !platformChecks[urlType]) {
      const platformNames = {
        'youtube': 'YouTube',
        'tiktok': 'TikTok',
        'instagram': 'Instagram',
        'facebook': 'Facebook',
        'twitter': 'Twitter',
        'fshare': 'Fshare'
      };
      toast.error(`Tính năng ${platformNames[urlType]} đã bị tắt bởi admin! Vì Ad đang nâng cấp ^^`);
      return;
    }

    // Kiểm tra tính năng Fshare VIP (legacy check)
    if (urlType === 'fshare' && !settings.enableFshareVip) {
      toast.error('Tính năng Fshare VIP đã bị tắt bởi admin!');
      return;
    }

    // Xử lý Fshare: kiểm tra bandwidth trước khi hiển thị modal
    if (urlType === 'fshare') {
      // Kiểm tra bandwidth Fshare
      const bandwidthUsage = (settings.fshareUsedBandwidthToday / settings.fshareDailyBandwidthLimit) * 100;

      if (bandwidthUsage >= 100) {
        toast.error(
          <div className="text-sm">
            <div className="font-medium mb-1">🚫 Fshare bandwidth đã hết!</div>
            <div className="text-xs text-gray-600">
              📊 Đã sử dụng: {settings.fshareUsedBandwidthToday.toFixed(1)}GB / {settings.fshareDailyBandwidthLimit}GB<br/>
              ⏰ Reset vào ngày mai lúc 00:00<br/>
              💡 Vui lòng thử lại sau hoặc sử dụng platform khác
            </div>
          </div>,
          { duration: 8000 }
        );
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      if (bandwidthUsage >= 90) {
        toast.warning(
          <div className="text-sm">
            <div className="font-medium mb-1">⚠️ Fshare bandwidth sắp hết!</div>
            <div className="text-xs text-gray-600">
              📊 Còn lại: {(settings.fshareDailyBandwidthLimit - settings.fshareUsedBandwidthToday).toFixed(1)}GB<br/>
              🎯 Đã sử dụng: {bandwidthUsage.toFixed(1)}%
            </div>
          </div>,
          { duration: 5000 }
        );
      }

      setShowEmailModal(true);
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setMediaData(null);

    // Kiểm tra URL Fshare không hợp lệ
    if (urlType === 'fshare-invalid') {
      setError('URL Fshare không hợp lệ. Vui lòng sử dụng định dạng: https://www.fshare.vn/file/ABCDEF123456');
      toast.error('URL Fshare không hợp lệ');
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    // Sử dụng API trung gian mới cho Fshare
    // if (urlType === 'fshare') {
    //   setError('Tính năng tải xuống từ Fshare đang tạm thời không khả dụng do thay đổi từ phía Fshare. Vui lòng sử dụng các nền tảng khác.');
    //   toast.error('Tính năng Fshare tạm thời không khả dụng');
    //   setIsSubmitting(false);
    //   setLoading(false);
    //   return;
    // }

    try {
      // Send request without quality option (will be selected in MediaDisplay)
      let endpoint = '/api/download';

      // Lưu request vào Firestore trước
      const requestData = {
        url,
        userEmail: currentUser.email,
        userName: currentUser.name || currentUser.email.split('@')[0],
        userId: currentUser.uid,
        platform: detectPlatform(url),
        useFshareVip
      };

      const saveResult = await requestService.createRequest(requestData);

      if (!saveResult.success) {
        throw new Error('Không thể lưu yêu cầu: ' + saveResult.error);
      }

      // Cập nhật request với trạng thái processing
      await requestService.updateRequest(saveResult.id, {
        status: 'processing'
      });

      const response = await api.post('/download', {
        url,
        requestId: saveResult.id,
        userID: currentUser.uid // Pass Firebase userID for storage management
      });

      // Cập nhật request với kết quả thành công
      const updateData = {
        status: 'completed',
        completedAt: new Date()
      };

      // Chỉ thêm các field nếu chúng có giá trị
      if (response.data?.fileSize) {
        updateData.fileSize = response.data.fileSize;
      }
      if (response.data?.downloadUrl) {
        updateData.downloadUrl = response.data.downloadUrl;
      }
      if (response.data?.actualQuality) {
        updateData.actualQuality = response.data.actualQuality;
      }

      await requestService.updateRequest(saveResult.id, updateData);

      // Tăng số lần download của user
      await userService.incrementUserDownloads(currentUser.uid);

      setMediaData(response.data);
      toast.success('Phân tích thành công! Vui lòng chọn chất lượng và tải xuống.');
    } catch (error) {
      console.error('Error fetching media:', error);

      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error.response?.data?.message || 'Không thể tải nội dung. Vui lòng thử lại.';
      setError(errorMessage);

      // Hiển thị toast với thông báo lỗi
      toast.error(errorMessage);

      // Log thông tin lỗi chi tiết để debug
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Get platform icon based on URL type
  const getPlatformIcon = () => {
    switch (urlType) {
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-red-500" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-black dark:text-white" />;
      case 'instagram':
        return <FaInstagram className="h-5 w-5 text-pink-500" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-blue-600" />;
      case 'twitter':
        return <FaTwitter className="h-5 w-5 text-blue-400" />;
      case 'fshare':
        return <FaDatabase className="h-5 w-5 text-green-500" />;
      case 'fshare-invalid':
        return <FaExclamationTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FaLink className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get input border color based on URL type
  const getInputStyles = () => {
    if (animateInput) {
      return 'border-red-500 dark:border-red-500 animate-shake';
    }

    switch (urlType) {
      case 'youtube':
        return 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500';
      case 'tiktok':
        return 'border-black dark:border-white focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white';
      case 'instagram':
        return 'border-pink-500 dark:border-pink-400 focus:ring-pink-500 focus:border-pink-500';
      case 'facebook':
        return 'border-blue-600 dark:border-blue-500 focus:ring-blue-600 focus:border-blue-600';
      case 'twitter':
        return 'border-blue-400 dark:border-blue-300 focus:ring-blue-400 focus:border-blue-400';
      case 'fshare':
        return 'border-green-500 dark:border-green-400 focus:ring-green-500 focus:border-green-500';
      case 'fshare-invalid':
        return 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500';
      default:
        return 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500';
    }
  };

  // Helper function to get gradient colors based on URL type
  const getGradientColors = () => {
    switch (urlType) {
      case 'youtube':
        return 'from-red-500 to-red-700 focus:ring-red-500';
      case 'tiktok':
        return 'from-black to-gray-800 focus:ring-black dark:from-white dark:to-gray-300 dark:focus:ring-white';
      case 'instagram':
        return 'from-pink-500 to-purple-600 focus:ring-pink-500';
      case 'facebook':
        return 'from-blue-600 to-blue-800 focus:ring-blue-600';
      case 'twitter':
        return 'from-blue-400 to-blue-600 focus:ring-blue-400';
      case 'fshare':
        return 'from-green-500 to-green-700 focus:ring-green-500';
      case 'fshare-invalid':
        return 'from-red-500 to-red-700 focus:ring-red-500';
      default:
        return 'from-blue-600 to-purple-600 focus:ring-blue-500';
    }
  };

  return (
    <div className="bg-[var(--card-background)] rounded-xl shadow-lg p-8 mb-8 mt-24 border border-[var(--border-color)]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
          Tải Video Từ Mạng Xã Hội
        </h2>

        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Dán link từ các nền tảng mạng xã hội phổ biến hoặc Fshare để tải video, hình ảnh và nhiều nội dung khác với chất lượng cao.
        </p>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Quy trình:</strong> Nhập link → Phân tích → Chọn chất lượng → Tải xuống
          </p>
        </div>

        {!isAuthenticated && (
          <div className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 max-w-2xl mx-auto bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
            <strong>Lưu ý:</strong> Bạn cần <button
              onClick={() => navigate('/login')}
              className="font-medium underline hover:text-indigo-800 dark:hover:text-indigo-300"
            >đăng nhập</button> hoặc <button
              onClick={() => navigate('/register')}
              className="font-medium underline hover:text-indigo-800 dark:hover:text-indigo-300"
            >đăng ký tài khoản</button> để sử dụng tính năng tải xuống.
          </div>
        )}

        {urlType === 'fshare' && (
          <div className="mt-3 text-sm text-green-600 dark:text-green-400 max-w-2xl mx-auto bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <strong>Thông báo:</strong> Tính năng tải xuống từ Fshare đã được kích hoạt! Bạn có thể tải xuống với tốc độ cao từ tài khoản VIP.
          </div>
        )}

        {urlType === 'fshare-invalid' && (
          <div className="mt-3 text-sm text-orange-600 dark:text-orange-400 max-w-2xl mx-auto bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
            <strong>Thông báo quan trọng:</strong> URL Fshare không hợp lệ. Vui lòng sử dụng định dạng đúng.
          </div>
        )}

        {urlType === 'fshare-invalid' && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
            <strong>Lỗi:</strong> URL Fshare không hợp lệ. Vui lòng sử dụng định dạng:
            <code className="mx-1 px-1 py-0.5 bg-white dark:bg-gray-800 rounded">https://www.fshare.vn/file/ABCDEF123456</code>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaYoutube className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm">YouTube</span>
        </div>
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaTiktok className="h-5 w-5 text-black dark:text-white mr-2" />
          <span className="text-sm">TikTok</span>
        </div>
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaInstagram className="h-5 w-5 text-pink-500 mr-2" />
          <span className="text-sm">Instagram</span>
        </div>
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaFacebook className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm">Facebook</span>
        </div>
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaTwitter className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-sm">Twitter</span>
        </div>
        <div className="flex items-center px-3 py-2 bg-[var(--platform-badge-bg)] rounded-lg border border-[var(--border-color)] shadow-sm platform-badge">
          <FaDatabase className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-sm">Fshare</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {getPlatformIcon()}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán link vào đây (VD: https://www.tiktok.com/...)"
            className={`block w-full pl-12 pr-12 py-4 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none bg-[var(--input-background)] text-[var(--text-primary)] border border-[var(--input-border)] text-lg ${getInputStyles()}`}
            disabled={isSubmitting}
          />

          {urlType && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                {urlType.toUpperCase()}
              </span>
            </div>
          )}
        </div>



        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center items-center py-4 sm:py-5 px-6 rounded-xl shadow-md text-white text-lg sm:text-xl font-medium transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[56px] sm:min-h-[64px] ${
            urlType ?
              `bg-gradient-to-r ${getGradientColors()}` :
              'bg-gradient-to-r from-indigo-600 to-violet-500 focus:ring-indigo-500'
          }`}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Đang xử lý...
            </>
          ) : urlType === 'fshare' ? (
            'Gửi Yêu Cầu'
          ) : (
            'Phân Tích'
          )}
        </button>
      </form>



      {/* Hiển thị thông báo đăng nhập */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FaLock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Yêu cầu đăng nhập
              </h3>
              <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-400">
                <p>
                  Bạn cần đăng nhập để sử dụng tính năng tải xuống. Đăng nhập giúp chúng tôi cung cấp dịch vụ tốt hơn và theo dõi lịch sử tải xuống của bạn.
                </p>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: '/' } })}
                  className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[44px]"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register', { state: { from: '/' } })}
                  className="inline-flex items-center justify-center px-4 py-3 border border-indigo-300 dark:border-indigo-700 text-base font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[44px]"
                >
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Dịch vụ miễn phí • {isAuthenticated ? 'Đã đăng nhập' : 'Yêu cầu đăng nhập'} • Tải xuống chất lượng cao</p>
      </div>

      {/* Hiển thị tiến trình tải xuống nếu có downloadId */}
      {downloadId && downloadStatus === 'processing' && (
        <div className="mt-8">
          <DownloadProgress
            downloadId={downloadId}
            onComplete={(result) => {
              setDownloadStatus('completed');
              setMediaData(result);
              toast.success(useFshareVip ? 'Đã lấy được link VIP!' : 'Tải xuống hoàn tất!');
            }}
            onError={(error) => {
              setDownloadStatus('error');
              setError(error.message || 'Đã xảy ra lỗi khi tải xuống');
              toast.error(error.message || 'Đã xảy ra lỗi khi tải xuống');
            }}
          />
        </div>
      )}

      {/* Email Modal cho Fshare */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chọn Email Nhận File
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Tên hiển thị"
                  className="block w-full pl-10 pr-3 py-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm border border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Email nhận file *"
                  required
                  className="block w-full pl-10 pr-3 py-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm border border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>📧 Lưu ý:</strong> File sẽ được upload lên Google Drive và chia sẻ với email này.
                  Bạn sẽ nhận được thông báo qua email khi file sẵn sàng tải xuống.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleFshareRequest(recipientEmail)}
                disabled={!recipientEmail}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Gửi Yêu Cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlForm;
