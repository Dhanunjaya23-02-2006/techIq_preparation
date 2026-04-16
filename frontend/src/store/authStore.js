import { create } from 'zustand';
import { authService } from '../services/authService';
import { formatError } from '../utils/error';


const getInitialAuth = () => {
  const token = localStorage.getItem('access_token');
  return !!(token && token !== 'undefined' && token !== 'null');
};

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (user && user !== 'undefined' && user !== 'null') {
      return JSON.parse(user);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage');
  }
  return null;
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialAuth(),
  isLoading: false,
  isProfileLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(credentials);
      // Backend returns {access_token, refresh_token, token_type, mfa_required}
      if (res.data.mfa_required) {
        set({ isLoading: false });
        return { success: true, mfa_required: true };
      }

      localStorage.setItem('access_token', res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem('refresh_token', res.data.refresh_token);
      }
      
      // Fetch profile after login
      set({ isProfileLoading: true });
      const profile = await authService.getProfile();
      const userData = profile.data;
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false, isProfileLoading: false });
      return { success: true, mfa_required: false };
    } catch (error) {
      set({ isLoading: false, isProfileLoading: false });
      return {
        success: false,
        message: formatError(error),
      };

    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authService.register(data);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const errors = error.response?.data;
      return {
        success: false,
        message: formatError(error),
      };

    }
  },

  fetchProfile: async () => {
    set({ isProfileLoading: true });
    try {
      const res = await authService.getProfile();
      const userData = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isProfileLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isProfileLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authService.updateProfile(data);
      const userData = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: formatError(error),
      };

    }
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    // Clear state/storage first for immediate UI response
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });

    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch (e) {
        console.warn('Backend logout failed, but local session was cleared:', e);
      }
    }
  },
  
  setupMfa: async () => {
    try {
      return await authService.setupMfa();
    } catch (error) {
      throw error;
    }
  },

  verifyMfa: async (code) => {
    try {
      const res = await authService.verifyMfa(code);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatError(error),
      };

    }
  },

  disableMfa: async () => {
    try {
      await authService.disableMfa();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatError(error),
      };

    }
  },
}));

export default useAuthStore;
