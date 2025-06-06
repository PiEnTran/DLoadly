import { useState, useEffect } from 'react';
import { FaSpinner, FaDownload, FaCopy, FaExclamationTriangle, FaCheckCircle, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaTwitter, FaCog, FaRedo, FaUser, FaEnvelope, FaClock, FaImage, FaMusic, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const MediaDisplay = ({ mediaData, loading, error }) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [currentMediaData, setCurrentMediaData] = useState(null);
  const [showQualityOptions, setShowQualityOptions] = useState(false);

  // Reset states when new media data is loaded
  useEffect(() => {
    setCopied(false);
    setIsPlaying(false);
    setDownloadStarted(false);
    setCurrentMediaData(mediaData);
  }, [mediaData]);

  // Function to change quality and reload media
  const changeQuality = async (newQuality) => {
    if (!mediaData || !mediaData.originalUrl || quality === newQuality) return;

    setIsChangingQuality(true);
    setQuality(newQuality);

    try {
      const endpoint = mediaData.source === 'Fshare' ? '/api/fshare/download' : '/api/download';
      const response = await axios.post(endpoint, {
        url: mediaData.originalUrl,
        quality: newQuality
      });

      setCurrentMediaData(response.data);
      toast.success(`Đã chuyển sang chất lượng ${newQuality}`);
    } catch (error) {
      console.error('Error changing quality:', error);
      toast.error('Không thể thay đổi chất lượng. Vui lòng thử lại.');
    } finally {
      setIsChangingQuality(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast.success('Đã sao chép link!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Không thể sao chép link'));
  };

  const handleDownload = (e) => {
    setDownloadStarted(true);
    toast.success('Bắt đầu tải xuống!');

    // For better UX, we can also trigger download programmatically
    if (displayData.downloadUrl) {
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = displayData.downloadUrl;
      link.download = displayData.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Prevent the default anchor behavior since we're handling it manually
      e.preventDefault();
    }
  };

  const getPlatformIcon = (source) => {
    if (!source) return null;

    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('youtube')) {
      return <FaYoutube className="h-5 w-5 text-red-500" />;
    } else if (sourceLower.includes('tiktok')) {
      return <FaTiktok className="h-5 w-5 text-black dark:text-white" />;
    } else if (sourceLower.includes('instagram')) {
      return <FaInstagram className="h-5 w-5 text-pink-500" />;
    } else if (sourceLower.includes('facebook')) {
      return <FaFacebook className="h-5 w-5 text-blue-600" />;
    } else if (sourceLower.includes('twitter')) {
      return <FaTwitter className="h-5 w-5 text-blue-400" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[300px] border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full animate-ping"></div>
          <FaSpinner className="relative animate-spin h-12 w-12 text-blue-500 mb-4" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Đang Xử Lý Nội Dung</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Chúng tôi đang tìm nạp nội dung của bạn. Quá trình này có thể mất một chút thời gian tùy thuộc vào kích thước tệp và nền tảng.
        </p>
      </div>
    );
  }

  if (error) {
    // Xác định loại lỗi để hiển thị thông báo phù hợp
    const isFshareError = error.includes('Fshare') || error.includes('tập tin') || error.includes('file');
    const isNetworkError = error.includes('network') || error.includes('kết nối') || error.includes('timeout');
    const isAuthError = error.includes('quyền') || error.includes('permission') || error.includes('access');

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-red-100 dark:border-red-900">
        <div className="flex items-center text-red-500 mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
            <FaExclamationTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Tải Xuống Thất Bại</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">{error}</p>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Nguyên nhân có thể:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {isFshareError && (
                <>
                  <li>Tập tin Fshare không tồn tại hoặc đã bị xóa</li>
                  <li>Link Fshare không chính xác hoặc đã hết hạn</li>
                  <li>Tập tin yêu cầu mật khẩu để truy cập</li>
                </>
              )}
              {isAuthError && (
                <>
                  <li>Bạn không có quyền truy cập tập tin này</li>
                  <li>Tập tin đã bị đặt ở chế độ riêng tư</li>
                </>
              )}
              {isNetworkError && (
                <>
                  <li>Vấn đề kết nối mạng</li>
                  <li>Máy chủ Fshare đang bảo trì hoặc quá tải</li>
                </>
              )}
              {!isFshareError && !isAuthError && !isNetworkError && (
                <>
                  <li>URL không hợp lệ hoặc từ nền tảng không được hỗ trợ</li>
                  <li>Nội dung đã bị xóa hoặc đặt ở chế độ riêng tư</li>
                  <li>Nền tảng đã thay đổi API hoặc cấu trúc</li>
                  <li>Vấn đề kết nối mạng</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vui lòng kiểm tra URL và thử lại. Đảm bảo rằng nó đến từ nền tảng được hỗ trợ và nội dung có thể truy cập công khai.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="ml-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors text-sm"
          >
            <FaRedo className="inline mr-2 h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!mediaData && !currentMediaData) {
    return null;
  }

  // Use currentMediaData if available, otherwise use mediaData
  const displayData = currentMediaData || mediaData;

  // Render request information
  const renderRequest = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <FaCheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Yêu cầu đã được gửi thành công!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            {displayData.message}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg w-full mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">ID Yêu cầu:</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{displayData.requestId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
              <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                Đang chờ xử lý
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">URL gốc:</span>
              <a
                href={displayData.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]"
              >
                {displayData.originalUrl}
              </a>
            </div>
          </div>

          {/* Instructions for Fshare requests */}
          {displayData.instructions && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 w-full">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
                📋 Quy trình xử lý:
              </h4>
              <ul className="space-y-2">
                {Array.isArray(displayData.instructions) ?
                  displayData.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-400 flex items-start">
                      <span className="mr-2 mt-0.5 text-blue-500">•</span>
                      {instruction}
                    </li>
                  )) : (
                    <li className="text-sm text-blue-700 dark:text-blue-400 flex items-start">
                      <span className="mr-2 mt-0.5 text-blue-500">•</span>
                      {displayData.instructions}
                    </li>
                  )
                }
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Quản trị viên sẽ xử lý yêu cầu của bạn và cung cấp link tải xuống sớm nhất có thể.
          </p>
        </div>
      </div>
    );
  };

  // Render based on media type
  const renderMedia = () => {
    if (!displayData) return null;

    switch (displayData.type) {
      case 'Video':
      case 'Audio':
      case 'Image':
      case 'File':
      case 'Instructions':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-0 overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Header with platform info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          {getPlatformIcon(displayData.source) && (
            <div className="bg-white dark:bg-gray-700 p-2 rounded-full mr-3 shadow-sm">
              {getPlatformIcon(displayData.source)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
              {displayData.title || 'Media Ready for Download'}
            </h3>
            {displayData.source && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Nguồn: {displayData.source}</span>
                {displayData.type && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{displayData.type}</span>
                  </>
                )}
                {displayData.actualQuality && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      📺 {displayData.actualQuality}
                    </span>
                  </>
                )}
                {displayData.watermarkFree === true && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      ✅ Không logo
                    </span>
                  </>
                )}
                {displayData.watermarkFree === false && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      ⚠️ Có thể có logo
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full flex items-center">
          <FaCheckCircle className="mr-1 h-3 w-3" />
          Sẵn Sàng Tải Xuống
        </div>
      </div>

      {/* Media preview */}
      {displayData.thumbnail && (
        <div className="relative group">
          <img
            src={displayData.thumbnail}
            alt={displayData.title || 'Media thumbnail'}
            className="w-full h-auto object-cover max-h-[400px]"
          />

          {/* Video controls overlay (for video content) */}
          {displayData.type && displayData.type.toLowerCase().includes('video') && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white/90 p-3 rounded-full hover:bg-white transition-colors"
                >
                  {isPlaying ?
                    <FaPause className="h-5 w-5 text-gray-800" /> :
                    <FaPlay className="h-5 w-5 text-gray-800" />
                  }
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-white/90 p-3 rounded-full hover:bg-white transition-colors"
                >
                  {isMuted ?
                    <FaVolumeMute className="h-5 w-5 text-gray-800" /> :
                    <FaVolumeUp className="h-5 w-5 text-gray-800" />
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download options */}
      <div className="p-6 space-y-6">

        {/* Instructions section for Facebook photos */}
        {displayData.type === 'Instructions' && displayData.instructions && (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg">
            <div className="space-y-2">
              {Array.isArray(displayData.instructions) ?
                displayData.instructions.map((instruction, index) => (
                  <p key={index} className={`${
                    instruction === '' ? 'h-2' :
                    instruction.startsWith('📸') ? 'text-lg font-bold text-yellow-800 dark:text-yellow-200' :
                    instruction.startsWith('🔒') || instruction.startsWith('⚠️') ? 'text-red-700 dark:text-red-300 font-medium' :
                    instruction.startsWith('💡') || instruction.startsWith('✅') ? 'text-green-700 dark:text-green-300 font-medium' :
                    instruction.startsWith('🌐') ? 'text-blue-700 dark:text-blue-300 font-mono text-sm break-all' :
                    instruction.match(/^\d️⃣/) ? 'text-gray-800 dark:text-gray-200 ml-4' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {instruction}
                  </p>
                )) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {displayData.instructions}
                  </p>
                )
              }
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={displayData.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center py-3 px-6 rounded-xl shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaExternalLinkAlt className="mr-2 h-5 w-5" />
                Mở Facebook Photo
              </a>

              <button
                onClick={() => copyToClipboard(displayData.originalUrl)}
                className="flex items-center justify-center py-3 px-6 rounded-xl shadow-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FaCopy className="mr-2 h-5 w-5" />
                Sao Chép Link
              </button>
            </div>
          </div>
        )}

        {displayData.downloadUrl && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Main download button */}
            <a
              href={displayData.downloadUrl}
              download={displayData.filename || true}
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center py-3 px-6 rounded-xl shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {downloadStarted ? (
                <>
                  <FaCheckCircle className="mr-2 h-5 w-5" />
                  Đã Bắt Đầu Tải
                </>
              ) : (
                <>
                  {displayData.type === 'Image' ? (
                    <FaImage className="mr-2 h-5 w-5" />
                  ) : displayData.type === 'Audio' ? (
                    <FaMusic className="mr-2 h-5 w-5" />
                  ) : (
                    <FaDownload className="mr-2 h-5 w-5" />
                  )}
                  Tải {displayData.type === 'Video' ? 'Video' :
                       displayData.type === 'Image' ? 'Ảnh' :
                       displayData.type === 'Audio' ? 'Âm Thanh' :
                       displayData.type === 'File' ? 'Tệp' : 'Nội Dung'}
                  {displayData.source === 'Fshare' && !displayData.isVipLink ? ' (Google Drive)' :
                   displayData.source === 'Fshare' && displayData.isVipLink ? ' (Link VIP)' : ''}
                </>
              )}
            </a>

            {/* Quality selector button - only for videos */}
            {displayData.type && displayData.type.toLowerCase().includes('video') && displayData.availableQualities && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQualityOptions(prev => !prev)}
                  className="flex items-center justify-center py-3 px-6 rounded-xl shadow-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                >
                  <FaCog className="mr-2 h-5 w-5" />
                  Chất Lượng: {quality}
                </button>

                {showQualityOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-10">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Chọn chất lượng:</div>

                      {/* Hiển thị các tùy chọn chất lượng từ API */}
                      {displayData.availableQualities && displayData.availableQualities.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {displayData.availableQualities.map((qualityOption, index) => (
                            <button
                              key={index}
                              type="button"
                              disabled={isChangingQuality}
                              onClick={() => {
                                changeQuality(qualityOption);
                                setShowQualityOptions(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md mb-1 ${
                                quality === qualityOption
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {qualityOption}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Không có tùy chọn chất lượng
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Copy link button */}
            <button
              onClick={() => copyToClipboard(displayData.downloadUrl)}
              className={`flex items-center justify-center py-3 px-6 rounded-xl shadow-md transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? (
                <>
                  <FaCheckCircle className="mr-2 h-5 w-5" />
                  Đã Sao Chép!
                </>
              ) : (
                <>
                  <FaCopy className="mr-2 h-5 w-5" />
                  Sao Chép Link
                </>
              )}
            </button>

            {isChangingQuality && (
              <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center rounded-xl z-20">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
                  <FaSpinner className="animate-spin h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Đang thay đổi chất lượng...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alternative downloads with better styling */}
        {displayData.alternativeDownloads && displayData.alternativeDownloads.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full mr-2">
                Tùy Chọn
              </span>
              Tải Xuống Thay Thế
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              {displayData.alternativeDownloads.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label || `Tùy chọn ${index + 1}`}
                  </span>
                  <div className="flex space-x-2">
                    <a
                      href={item.url}
                      download={item.filename || `${displayData.title || 'download'}_${item.label || 'alternative'}`}
                      className="text-sm py-1.5 px-3 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                    >
                      <FaDownload className="inline mr-1.5 h-3.5 w-3.5" />
                      Tải Xuống
                    </a>
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="text-sm py-1.5 px-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                      <FaCopy className="inline mr-1.5 h-3.5 w-3.5" />
                      Sao Chép
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Drive or VIP link notice */}
        {displayData.source === 'Fshare' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {displayData.isVipLink ? 'Link VIP Fshare' : 'Tải xuống từ Google Drive'}
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                  {displayData.isVipLink ? (
                    <p>
                      Đã lấy được link VIP trực tiếp từ Fshare. Link này cho phép tải xuống với tốc độ cao.
                      Khi bạn nhấn nút "Tải Tệp", trình duyệt sẽ mở một tab mới và bắt đầu tải xuống trực tiếp từ Fshare với tốc độ VIP.
                    </p>
                  ) : (
                    <p>
                      File từ Fshare đã được tải xuống và upload lên Google Drive thành công.
                      Khi bạn nhấn nút "Tải Tệp", trình duyệt sẽ mở một tab mới và bắt đầu tải xuống từ Google Drive.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Original URL */}
        {displayData.originalUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">URL Gốc:</span>
              <button
                onClick={() => copyToClipboard(displayData.originalUrl)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sao chép link gốc
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
              {displayData.originalUrl}
            </div>
          </div>
        )}
      </div>
    </div>
        );
      case 'Request':
        return renderRequest();
      default:
        return (
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Không thể hiển thị nội dung này. Vui lòng tải xuống để xem.
            </p>
          </div>
        );
    }
  };

  return renderMedia();
};

export default MediaDisplay;
