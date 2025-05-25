// Network utility functions for handling Firestore connection issues

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);

      // Check if it's a network error
      if (isNetworkError(error)) {
        if (i === maxRetries - 1) {
          throw new Error(`Network error after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Non-network error, don't retry
        throw error;
      }
    }
  }
};

// Check if error is network-related
export const isNetworkError = (error) => {
  const networkErrorCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'cancelled',
    'unknown'
  ];

  const networkErrorMessages = [
    'network',
    'connection',
    'timeout',
    'offline',
    'ERR_NETWORK_CHANGED',
    'ERR_INTERNET_DISCONNECTED',
    'Failed to fetch'
  ];

  // Check error code
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  // Check error message
  const errorMessage = error.message?.toLowerCase() || '';
  return networkErrorMessages.some(msg => errorMessage.includes(msg));
};

// Enhanced Firestore operation wrapper
export const firestoreOperation = async (operation, operationName = 'Firestore operation') => {
  try {
    return await retryWithBackoff(operation);
  } catch (error) {
    console.error(`${operationName} failed:`, error);

    // Return a user-friendly error message
    if (isNetworkError(error)) {
      return {
        success: false,
        error: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
        isNetworkError: true
      };
    } else {
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra',
        isNetworkError: false
      };
    }
  }
};

// Check network connectivity
export const checkNetworkConnectivity = async () => {
  try {
    // Try to fetch a small resource from Google
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    console.log('Network connectivity check failed:', error);
    return false;
  }
};

// Network status monitor
export class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    console.log('Network: Back online');
    this.isOnline = true;
    this.notifyListeners('online');
  }

  handleOffline() {
    console.log('Network: Gone offline');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  getStatus() {
    return this.isOnline;
  }
}

// Create singleton instance
export const networkMonitor = new NetworkMonitor();

// React hook for network status (import React in component that uses this)
export const createNetworkStatusHook = (React) => {
  return () => {
    const [isOnline, setIsOnline] = React.useState(networkMonitor.getStatus());

    React.useEffect(() => {
      const handleStatusChange = (status) => {
        setIsOnline(status === 'online');
      };

      networkMonitor.addListener(handleStatusChange);

      return () => {
        networkMonitor.removeListener(handleStatusChange);
      };
    }, []);

    return isOnline;
  };
};
