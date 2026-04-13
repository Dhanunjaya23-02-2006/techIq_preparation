import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  
  if (token && token !== 'undefined' && token !== 'null') {
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    const isPublicRoute = config.url?.includes('/accounts/login') || 
                          config.url?.includes('/accounts/register') ||
                          config.url?.includes('/accounts/admin-exists') ||
                          config.url?.includes('/analytics/visit');
    if (!isPublicRoute) {
      console.warn('API Request without token:', config.url);
    }
  }
  return config;
});

// Response interceptor — handle token refresh and unauthorized access
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicRoute = originalRequest.url.includes('/subscriptions/plans/') || 
                         originalRequest.url.includes('/accounts/login') ||
                         originalRequest.url.includes('/accounts/register') ||
                         originalRequest.url.includes('/accounts/admin-exists');
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isPublicRoute) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          const res = await axios.post(`${BASE_URL}/accounts/token/refresh`, {
            refresh_token_str: refreshToken,
          });
          
          const { access_token, refresh_token } = res.data;
          localStorage.setItem('access_token', access_token);
          if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
          
          isRefreshing = false;
          onRefreshed(access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          console.error('Refresh token failed:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { redirect: '/login' } }));
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { redirect: '/login' } }));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Global Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only toast if it's not a 401 (token refresh)
    const status = error.response?.status;
    
    // Some routes might handle errors themselves, but a global one is a good safety net
    if (status && status !== 401 && status !== 404) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Server Error. Please try again.';
      
      // We use a dynamic import for toast to avoid circular dependency if needed
      import('react-hot-toast').then(({ toast }) => {
        toast.error(message, { id: 'global-api-error' });
      });
    } else if (!error.response && error.message === 'Network Error') {
      import('react-hot-toast').then(({ toast }) => {
        toast.error('Network error. Check your connection.', { id: 'network-error' });
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;

