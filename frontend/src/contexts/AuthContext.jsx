import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/firebaseService';
import axios from 'axios';

// Tạo context
const AuthContext = createContext();

// Hook để sử dụng context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Kiểm tra trạng thái đăng nhập với Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Người dùng đã đăng nhập
        try {
          // Lấy thông tin user từ Firestore bằng UID
          const userResult = await userService.getUserById(user.uid);
          if (userResult.success) {
            // User đã tồn tại trong Firestore
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userResult.data
            });
          } else {
            // User chưa tồn tại trong Firestore, tạo mới với UID làm document ID
            // Mặc định tất cả user mới đều là "user", chỉ admin mới có thể thay đổi role
            const userData = {
              email: user.email,
              role: 'user', // Mặc định luôn là user
              name: user.displayName || user.email.split('@')[0],
              totalDownloads: 0
            };

            // Tạo user với UID làm document ID để tránh duplicate
            const createResult = await userService.createUserWithId(user.uid, userData);
            if (createResult.success) {
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                ...userData
              });
            } else {
              console.error('Error creating user:', createResult.error);
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                role: 'user',
                name: user.email.split('@')[0]
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            role: 'user',
            name: user.email.split('@')[0]
          });
        }
      } else {
        // Người dùng chưa đăng nhập
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hàm đăng nhập với Firebase
  const login = async (email, password, rememberMe) => {
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Kiểm tra email đã được xác nhận chưa (BẮT BUỘC VERIFICATION)
      if (!user.emailVerified) {
        setLoading(false);
        return {
          success: false,
          error: 'Email chưa được xác nhận. Vui lòng nhập mã xác nhận.',
          needEmailVerification: true,
          email: user.email,
          requireCodeVerification: true
        };
      }

      // Firebase Auth sẽ tự động trigger onAuthStateChanged
      // và cập nhật currentUser

      if (rememberMe) {
        localStorage.setItem('userEmail', email);
      }

      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mật khẩu không chính xác.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tài khoản đã bị vô hiệu hóa.';
          break;
        default:
          errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Hàm đăng ký với Firebase
  const register = async (userData) => {
    setLoading(true);

    try {
      // Tạo user với Firebase Auth (không tự động gửi verification email)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const user = userCredential.user;

      console.log('🔄 User created in Firebase:', user.uid);

      // Gửi custom email xác nhận với mã OTP
      try {
        console.log('🔄 Attempting to send custom verification email...');
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/custom-auth/send-verification-email`, {
          email: userData.email,
          name: userData.fullName
        });
        console.log('✅ Custom verification email with OTP sent:', response.data);
      } catch (emailError) {
        console.error('❌ Failed to send custom verification email:', emailError);
        console.error('❌ Error details:', emailError.response?.data);

        // Tạm thời comment out Firebase fallback để debug
        // await sendEmailVerification(user);
        // console.log('✅ Fallback Firebase verification email sent');

        // Throw error để thấy vấn đề
        throw new Error(`Custom email failed: ${emailError.response?.data?.error || emailError.message}`);
      }

      // Tạo user document trong Firestore với UID làm document ID
      // Mặc định tất cả user mới đều là "user"
      const userDoc = {
        email: userData.email,
        name: userData.fullName,
        role: 'user', // Mặc định luôn là user
        totalDownloads: 0,
        emailVerified: false // Thêm trạng thái xác nhận email
      };

      await userService.createUserWithId(user.uid, userDoc);

      setLoading(false);
      return {
        success: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhập mã xác nhận.',
        needEmailVerification: true,
        email: userData.email
      };
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được sử dụng.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
          break;
        default:
          errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Hàm đăng xuất với Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userEmail');
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Hàm quên mật khẩu với Firebase
  const forgotPassword = async (email) => {
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Không thể gửi email khôi phục. Vui lòng thử lại.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        default:
          errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Hàm gửi lại email xác nhận
  const resendEmailVerification = async () => {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Không tìm thấy người dùng hiện tại.'
      };
    }

    setLoading(true);

    try {
      await sendEmailVerification(auth.currentUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Không thể gửi email xác nhận. Vui lòng thử lại.';

      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Hàm kiểm tra trạng thái xác nhận email
  const checkEmailVerification = async () => {
    if (!auth.currentUser) {
      return { verified: false };
    }

    try {
      await reload(auth.currentUser);
      const isVerified = auth.currentUser.emailVerified;

      // Cập nhật trạng thái trong Firestore nếu email đã được xác nhận
      if (isVerified && currentUser && !currentUser.emailVerified) {
        await userService.updateUser(auth.currentUser.uid, {
          emailVerified: true
        });
      }

      return { verified: isVerified };
    } catch (error) {
      console.error('Error checking email verification:', error);
      return { verified: false };
    }
  };

  // Giá trị được cung cấp cho context
  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resendEmailVerification,
    checkEmailVerification,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
