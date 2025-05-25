import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FaEnvelope, FaCheckCircle, FaSpinner, FaRedo, FaArrowLeft } from 'react-icons/fa';

const EmailVerificationCodePage = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'light';
  });

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);
  
  // Lấy email từ state hoặc currentUser
  const email = location.state?.email || currentUser?.email || '';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Countdown timer for code expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newCode = digits.split('');
          setCode(newCode);
          handleVerifyCode(digits);
        }
      });
    }
  };

  const handleVerifyCode = async (codeString = code.join('')) => {
    if (codeString.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 số');
      return;
    }

    setIsVerifying(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/custom-auth/verify-email-code`, {
        code: codeString,
        email: email
      });

      if (response.data.success) {
        setIsVerified(true);
        toast.success(response.data.message);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              emailVerified: true,
              email: response.data.email 
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Code verification error:', error);
      const errorMessage = error.response?.data?.error || 'Mã xác nhận không đúng';
      toast.error(errorMessage);
      
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/custom-auth/resend-verification-email`, {
        email: email,
        name: currentUser?.displayName || 'User'
      });
      
      if (response.data.success) {
        toast.success('Mã xác nhận mới đã được gửi! 📧');
        setCountdown(60); // 60 seconds countdown
        setTimeLeft(15 * 60); // Reset expiration timer
        setCode(['', '', '', '', '', '']); // Clear current code
        inputRefs.current[0]?.focus();
      } else {
        toast.error(response.data.error || 'Không thể gửi lại mã xác nhận');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      const errorMessage = error.response?.data?.error || 'Đã xảy ra lỗi khi gửi mã';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--main-background)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Không tìm thấy email
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Vui lòng đăng ký lại để nhận mã xác nhận
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng ký lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--main-background)]">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Quay lại
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                {isVerifying ? (
                  <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
                ) : isVerified ? (
                  <FaCheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <FaEnvelope className="w-8 h-8 text-blue-600" />
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isVerified ? 'Email đã được xác nhận!' : 'Nhập mã xác nhận'}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400">
                {isVerified ? (
                  'Bạn sẽ được chuyển hướng đến trang đăng nhập...'
                ) : (
                  <>
                    Chúng tôi đã gửi mã 6 số đến <br />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
                  </>
                )}
              </p>
            </div>

            {!isVerified && (
              <>
                {/* Code Input */}
                <div className="mb-6">
                  <div className="flex justify-center space-x-3 mb-4">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                        disabled={isVerifying}
                      />
                    ))}
                  </div>
                  
                  {/* Timer */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mã sẽ hết hạn sau: <span className="font-mono font-bold text-red-600">{formatTime(timeLeft)}</span>
                    </p>
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerifyCode()}
                  disabled={isVerifying || code.some(digit => digit === '')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isVerifying ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Đang xác nhận...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>

                {/* Resend Button */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Không nhận được mã?
                  </p>
                  <button
                    onClick={handleResendCode}
                    disabled={isResending || countdown > 0}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
                  >
                    {isResending ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : countdown > 0 ? (
                      `Gửi lại sau ${countdown}s`
                    ) : (
                      <>
                        <FaRedo className="mr-2" />
                        Gửi lại mã
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Lưu ý:</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Mã có hiệu lực trong 15 phút</li>
                    <li>• Kiểm tra thư mục spam nếu không thấy email</li>
                    <li>• Bạn có thể dán mã từ clipboard</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationCodePage;
