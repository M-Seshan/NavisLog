import axios from 'axios';

// Base API instance configuration
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token from LocalStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('navislog_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 Unauthenticated Session Expirations
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authentication credentials
      localStorage.removeItem('navislog_token');
      localStorage.removeItem('navislog_user');

      // Redirect user to authentication page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;