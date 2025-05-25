// Environment configuration
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5002',
    SOCKET_URL: 'http://localhost:5002'
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://your-railway-app.railway.app',
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://your-railway-app.railway.app'
  }
};

const environment = import.meta.env.MODE || 'development';

export default config[environment];
