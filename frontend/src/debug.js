// Debug environment variables
console.log('🔍 DEBUG Environment Variables:');
console.log('MODE:', import.meta.env.MODE);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);

// Debug config
import environment from './config/environment.js';
console.log('🔍 DEBUG Config:');
console.log('Environment config:', environment);
console.log('API_BASE_URL:', environment.API_BASE_URL);
console.log('SOCKET_URL:', environment.SOCKET_URL);

// Export for global access
window.debugEnv = {
  mode: import.meta.env.MODE,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  socketUrl: import.meta.env.VITE_SOCKET_URL,
  nodeEnv: import.meta.env.NODE_ENV,
  config: environment
};

console.log('🔍 DEBUG: window.debugEnv available in console');
