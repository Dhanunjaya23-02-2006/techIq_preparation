import api from './api';

export const authService = {
  login: (credentials) => {
    // Backend uses OAuth2PasswordRequestForm which expects form-encoded data
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    if (credentials.mfa_code) {
      formData.append('mfa_code', credentials.mfa_code);
    }
    return api.post('/accounts/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (data) => api.post('/accounts/register', data),
  sendRegisterOtp: (email) => api.post('/accounts/register/otp', { email }),
  logout: (refreshToken) => api.post('/accounts/logout', { refresh_token_str: refreshToken }),
  refreshToken: (refreshToken) => api.post('/accounts/token/refresh', { refresh_token_str: refreshToken }),
  getProfile: () => api.get('/accounts/profile'),
  updateProfile: (data) => {
    const isFormData = data instanceof FormData;
    return api.patch('/accounts/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  getUsers: () => api.get('/accounts/users'),
  deleteUser: (id) => api.delete(`/accounts/users/${id}`),
  checkAdminExists: () => api.get('/accounts/admin-exists'),
  bulkActivate: (userIds, planType = 'pro', planId = null) => 
    api.post('/accounts/users/bulk-activate', { 
      user_ids: userIds, 
      plan_type: planType,
      plan_id: planId 
    }),
  bulkDelete: (userIds) => api.post('/accounts/users/bulk-delete', { user_ids: userIds }),
  bulkRegister: (formData) => api.post('/accounts/users/bulk-register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  forgotPassword: (email) => api.post('/accounts/forgot-password', { email }),
  resetPassword: (data) => api.post('/accounts/reset-password', data),
  setupMfa: () => api.post('/accounts/mfa/setup'),
  verifyMfa: (code) => api.post('/accounts/mfa/verify', { code }, { params: { code } }), // Backend might expect it in body or query depending on how it was written. In my backend I used Body(..., embed=True) for 'code' in verify_mfa
  disableMfa: () => api.post('/accounts/mfa/disable'),
};
