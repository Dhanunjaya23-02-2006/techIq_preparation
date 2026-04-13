import api from './api';

export const questionService = {
  getAll: (params) => api.get('/questions/', { params }),
  getById: (id) => api.get(`/questions/${id}/`),
  create: (data) => api.post('/questions/', data),
  update: (id, data) => api.patch(`/questions/${id}/`, data),
  delete: (id) => api.delete(`/questions/${id}/`),
  bulkAction: (data) => api.post('/questions/bulk_action/', data),
  importCsv: (formData) => api.post('/questions/import_csv/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStats: () => api.get('/questions/stats/'),
};
