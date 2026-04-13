import api from './api';

export const testService = {
  getMockTests: (params) => api.get('/tests/mock/', { params }),
  getMockTest: (id) => api.get(`/tests/mock/${id}/`),
  createMockTest: (data) => api.post('/tests/mock/', data),
  updateMockTest: (id, data) => api.patch(`/tests/mock/${id}/`, data),
  deleteMockTest: (id) => api.delete(`/tests/mock/${id}/`),
  startTest: (testId) => api.post(`/tests/start/${testId}/`),
  submitTest: (attemptId, data) => api.post(`/tests/submit/${attemptId}/`, data),
  getHistory: () => api.get('/tests/history/'),
  getAttemptDetails: (attemptId) => api.get(`/tests/attempt/${attemptId}/details`),
};

export const pdfService = {
  upload: (formData) => api.post('/pdf/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getList: () => api.get('/pdf/list/'),
  generateStandalone: (data) => api.post('/pdf/generate/', data),
  clearHistory: () => api.delete('/pdf/clear-history/'),
};

export const analyticsService = {
  getPerformance: () => api.get('/analytics/performance/'),
};

export const leaderboardService = {
  get: (params) => api.get('/leaderboard/', { params }),
};

export const contentService = {
  getMaterials: (params) => api.get('/content/study-materials/', { params }),
  createMaterial: (data) => api.post('/content/study-materials/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateMaterial: (id, data) => api.patch(`/content/study-materials/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteMaterial: (id) => api.delete(`/content/study-materials/${id}/`),
  getCurrentAffairs: () => api.get('/content/current-affairs/'),
  generateDailyCurrentAffairs: () => api.post('/content/current-affairs/generate_daily/'),
};

export const subscriptionService = {
  getPlans: () => api.get('/subscriptions/plans/'),
  getMySubscriptions: () => api.get('/subscriptions/my/'),
};
