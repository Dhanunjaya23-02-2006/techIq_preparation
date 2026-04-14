import api from './api';

export const paymentService = {
  checkout: (planId, paymentType = 'full') => 
    api.post('/subscriptions/checkout/', { plan_id: planId, payment_type: paymentType }),
  verifyPayment: (razorpayData) => 
    api.post('/subscriptions/verify-payment/', razorpayData),
  getAdminPlans: () => api.get('/subscriptions/admin/plans/'),
  createPlan: (planData) => api.post('/subscriptions/admin/plans/', planData),
  updatePlan: (id, planData) => api.put(`/subscriptions/admin/plans/${id}`, planData),
  deletePlan: (id) => api.delete(`/subscriptions/admin/plans/${id}`),
  assignPlan: (assignmentData) => api.post('/subscriptions/admin/assign-plan/', assignmentData),
};
