import api from './api';

const notificationService = {
  getNotifications: (skip = 0, limit = 20) => {
    return api.get(`/notifications/?skip=${skip}&limit=${limit}`);
  },

  markAsRead: (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.post('/notifications/read-all');
  }
};

export default notificationService;
