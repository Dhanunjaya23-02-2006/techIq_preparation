import api from './api';

export const getAdminStats = async () => {
  const response = await api.get('/analytics/admin-dashboard');
  return response.data;
};

export const getPerformanceStats = async () => {
  const response = await api.get('/analytics/performance/');
  return response.data;
};

export const logVisit = async () => {
  try {
    await api.post('/analytics/visit');
  } catch (error) {
    console.error("Failed to log visit", error);
  }
};
