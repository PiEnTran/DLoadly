import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FaEnvelope, FaCheckCircle, FaSpinner, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

const EmailVerificationPage = () => {
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

  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);

  const { resendEmailVerification, checkEmailVerification, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Lấy email từ state hoặc currentUser
  const email = location.state?.email || currentUser?.email || '';

  // Lấy token từ URL nếu có (từ email link)
  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-verify token from URL if present
  useEffect(() => {
    if (tokenFromUrl) {
      verifyEmailToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Verify email token from URL
  const verifyEmailToken = async (token) => {
    setIsVerifyingToken(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/custom-auth/verify-email-token`, {
        token
      });

      if (response.data.success) {
        setIsVerified(true);
        setTokenStatus('verified');
        toast.success('Email đã được xác nhận thành công! 🎉');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            state: {
              emailVerified: true,
              email: response.data.email
            }
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      const errorMessage = error.response?.data?.error || 'Không thể xác nhận email';
      setTokenStatus('invalid');
      toast.error(errorMessage);
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Auto check email verification every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isVerified) {
        const result = await checkEmailVerification();
        if (result.verified) {
          setIsVerified(true);
          toast.success('Email đã được xác nhận thành công!');
          setTimeout(() => {
            navigate('/login', { state: { emailVerified: true } });
          }, 2000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isVerified, checkEmailVerification, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      // Use custom email service
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/custom-auth/resend-verification-email`, {
        email: email,
        name: currentUser?.displayName || 'User'
      });

      if (response.data.success) {
        toast.success('Email xác nhận đã được gửi lại! 📧');
        setCountdown(60); // 60 seconds countdown
      } else {
        toast.error(response.data.error || 'Không thể gửi lại email xác nhận');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      const errorMessage = error.response?.data?.error || 'Đã xảy ra lỗi khi gửi email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckNow = async () => {
    setIsChecking(true);

    try {
      const result = await checkEmailVerification();

      if (result.verified) {
        setIsVerified(true);
        toast.success('Email đã được xác nhận thành công!');
        setTimeout(() => {
          navigate('/login', { state: { emailVerified: true } });
        }, 2000);
      } else {
        toast.info('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi kiểm tra xác nhận email');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                {isVerifyingToken ? (
                  <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
                ) : isVerified ? (
                  <FaCheckCircle className="w-8 h-8 text-green-600" />
                ) : tokenStatus === 'invalid' ? (
                  <FaExclamationTriangle className="w-8 h-8 text-red-600" />
                ) : (
                  <FaEnvelope className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isVerifyingToken ? 'Đang xác nhận email...' :
                 isVerified ? 'Email đã được xác nhận!' :
                 tokenStatus === 'invalid' ? 'Link xác nhận không hợp lệ' :
                 'Xác nhận email của bạn'}
              </h1>

              <p className="text-gray-600 dark:text-gray-400">
                {isVerifyingToken ? (
                  'Vui lòng đợi trong giây lát...'
                ) : isVerified ? (
                  'Bạn sẽ được chuyển hướng đến trang đăng nhập...'
                ) : tokenStatus === 'invalid' ? (
                  'Link xác nhận đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại email xác nhận.'
                ) : (
                  <>
                    Chúng tôi đã gửi email xác nhận đến <br />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
                  </>
                )}
              </p>
            </div>

            {!isVerified && (
              <>
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Hướng dẫn xác nhận:
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. Kiểm tra hộp thư email của bạn</li>
                    <li>2. Tìm email từ DLoadly</li>
                    <li>3. Nhấp vào liên kết xác nhận trong email</li>
                    <li>4. Quay lại trang này để tiếp tục</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={handleCheckNow}
                    disabled={isChecking}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {isChecking ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Tôi đã xác nhận email
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResendEmail}
                    disabled={isResending || countdown > 0}
                    className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {isResending ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <FaRedo className="mr-2" />
                        Gửi lại sau {countdown}s
                      </>
                    ) : (
                      <>
                        <FaRedo className="mr-2" />
                        Gửi lại email xác nhận
                      </>
                    )}
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                    <button
                      onClick={handleResendEmail}
                      disabled={countdown > 0}
                      className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400"
                    >
                      gửi lại
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Back to Login */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                ← Quay lại trang đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
