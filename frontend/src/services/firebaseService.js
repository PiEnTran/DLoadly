import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { firestoreOperation } from '../utils/networkUtils';

// Collections
const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'downloadRequests',
  SETTINGS: 'settings'
};

// Utility function to clean data before sending to Firestore
const cleanFirestoreData = (data) => {
  const cleanData = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    // Only include defined, non-null values
    if (value !== undefined && value !== null) {
      // Handle empty strings - convert to null if needed, or keep as is
      if (typeof value === 'string' && value.trim() === '') {
        // Keep empty strings as is, don't convert to null
        cleanData[key] = value;
      } else {
        cleanData[key] = value;
      }
    }
  });

  // Log cleaned data for debugging
  console.log('Firestore data cleaned:', { original: data, cleaned: cleanData });
  return cleanData;
};

// User Management
export const userService = {
  // Tạo user mới với auto-generated ID
  async createUser(userData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Tạo user mới với custom ID (sử dụng UID từ Firebase Auth)
  async createUserWithId(userId, userData) {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(docRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: userId };
    } catch (error) {
      console.error('Error creating user with ID:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy tất cả users
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'))
      );
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy user theo ID
  async getUserById(userId) {
    return await firestoreOperation(async () => {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'User not found' };
      }
    }, 'Get user by ID');
  },

  // Cập nhật user
  async updateUser(userId, userData) {
    try {
      const cleanData = cleanFirestoreData(userData);
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Tăng số lần download của user
  async incrementUserDownloads(userId) {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentDownloads = docSnap.data().totalDownloads || 0;
        await updateDoc(docRef, {
          totalDownloads: currentDownloads + 1,
          updatedAt: serverTimestamp()
        });
        return { success: true };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error incrementing user downloads:', error);
      return { success: false, error: error.message };
    }
  },

  // Xóa user
  async deleteUser(userId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Dọn dẹp duplicate users (giữ lại user có UID hợp lệ)
  async cleanupDuplicateUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const users = [];
      const emailMap = new Map();
      const duplicates = [];

      // Thu thập tất cả users
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        users.push(userData);

        // Theo dõi duplicate emails
        if (emailMap.has(userData.email)) {
          duplicates.push(userData);
        } else {
          emailMap.set(userData.email, userData);
        }
      });

      // Xóa duplicates (giữ lại user đầu tiên cho mỗi email)
      const deletePromises = duplicates.map(user => this.deleteUser(user.id));
      await Promise.all(deletePromises);

      return {
        success: true,
        message: `Đã xóa ${duplicates.length} user duplicate`,
        deletedCount: duplicates.length
      };
    } catch (error) {
      console.error('Error cleaning up duplicate users:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener cho users
  onUsersChange(callback) {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });

        console.log('📡 Firebase real-time: Users updated', users.length);
        callback(users);
      }, (error) => {
        console.error('Error in users real-time listener:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up users listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }
};

// Download Request Management
export const requestService = {
  // Tạo request mới
  async createRequest(requestData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.REQUESTS), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating request:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy tất cả requests
  async getAllRequests() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.REQUESTS), orderBy('createdAt', 'desc'))
      );
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: requests };
    } catch (error) {
      console.error('Error getting requests:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy requests gần đây
  async getRecentRequests(limitCount = 5) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.REQUESTS),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      );
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: requests };
    } catch (error) {
      console.error('Error getting recent requests:', error);
      return { success: false, error: error.message };
    }
  },

  // Cập nhật request
  async updateRequest(requestId, requestData) {
    try {
      const cleanData = cleanFirestoreData(requestData);
      const docRef = doc(db, COLLECTIONS.REQUESTS, requestId);
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating request:', error);
      return { success: false, error: error.message };
    }
  },

  // Xóa request
  async deleteRequest(requestId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.REQUESTS, requestId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting request:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy thống kê
  async getStats() {
    try {
      const allRequestsSnapshot = await getDocs(collection(db, COLLECTIONS.REQUESTS));
      const allUsersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));

      const requests = [];
      allRequestsSnapshot.forEach((doc) => {
        requests.push(doc.data());
      });

      const users = [];
      allUsersSnapshot.forEach((doc) => {
        users.push(doc.data());
      });

      // Tính tổng downloads từ user data
      const totalDownloadsFromUsers = users.reduce((total, user) => {
        return total + (user.totalDownloads || 0);
      }, 0);

      // Tính storage sử dụng (ước tính)
      const completedRequests = requests.filter(r => r.status === 'completed');
      const estimatedStorageGB = completedRequests.length * 0.05; // Ước tính 50MB per file

      const stats = {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        failedRequests: requests.filter(r => r.status === 'failed').length,
        processingRequests: requests.filter(r => r.status === 'processing').length,
        totalUsers: allUsersSnapshot.size,
        totalDownloads: Math.max(totalDownloadsFromUsers, completedRequests.length),
        storageUsed: `${estimatedStorageGB.toFixed(2)}GB`,
        // Thống kê theo platform
        platformStats: this.getPlatformStats(requests),
        // Thống kê theo thời gian
        recentActivity: this.getRecentActivity(requests)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper function để thống kê theo platform
  getPlatformStats(requests) {
    const platformCounts = {};
    requests.forEach(request => {
      const platform = request.platform || 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    return platformCounts;
  },

  // Helper function để thống kê hoạt động gần đây
  getRecentActivity(requests) {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentRequests = requests.filter(request => {
      const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
      return createdAt >= last24Hours;
    });

    const weeklyRequests = requests.filter(request => {
      const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
      return createdAt >= last7Days;
    });

    return {
      last24Hours: recentRequests.length,
      last7Days: weeklyRequests.length
    };
  },

  // Real-time listener cho requests
  onRequestsChange(callback) {
    try {
      const q = query(collection(db, COLLECTIONS.REQUESTS), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requests = [];
        querySnapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });

        console.log('📡 Firebase real-time: Requests updated', requests.length);
        callback(requests);
      }, (error) => {
        console.error('Error in requests real-time listener:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up requests listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }
};

// Settings Management
export const settingsService = {
  // Lấy cài đặt
  async getSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.SETTINGS));
      const settings = {};
      querySnapshot.forEach((doc) => {
        settings[doc.id] = doc.data().value;
      });
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Cập nhật cài đặt
  async updateSettings(settingsData) {
    try {
      const updatePromises = [];
      for (const [key, value] of Object.entries(settingsData)) {
        const docRef = doc(db, COLLECTIONS.SETTINGS, key);
        updatePromises.push(
          setDoc(docRef, {
            value,
            updatedAt: serverTimestamp()
          }, { merge: true })
        );
      }
      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy một cài đặt cụ thể
  async getSetting(key) {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, key);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().value };
      } else {
        return { success: false, error: 'Setting not found' };
      }
    } catch (error) {
      console.error('Error getting setting:', error);
      return { success: false, error: error.message };
    }
  },

  // Khởi tạo cài đặt mặc định
  async initializeDefaultSettings() {
    try {
      const defaultSettings = {
        dailyDownloadLimit: 10,
        maxFileSize: 500, // MB
        fshareEmail: '',
        fsharePassword: '',
        googleDriveApiKey: '',
        enableFshareVip: false,
        enableGoogleDrive: false,
        // Platform settings
        enableYoutube: true,
        enableTiktok: true,
        enableInstagram: true,
        enableFacebook: true,
        enableTwitter: true,
        enableFshare: true
      };

      const updatePromises = [];
      for (const [key, value] of Object.entries(defaultSettings)) {
        const docRef = doc(db, COLLECTIONS.SETTINGS, key);
        const docSnap = await getDoc(docRef);

        // Chỉ tạo nếu chưa tồn tại
        if (!docSnap.exists()) {
          updatePromises.push(
            setDoc(docRef, {
              value,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          );
        }
      }

      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error initializing default settings:', error);
      return { success: false, error: error.message };
    }
  }
};

export default {
  userService,
  requestService,
  settingsService
};
