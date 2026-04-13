import api from './api';

export const paymentService = {
  checkout: (planId, paymentType = 'full') => 
    api.post('/subscriptions/checkout/', { plan_id: planId, payment_type: paymentType }),
  verifyPayment: (razorpayData) => 
    api.post('/subscriptions/verify-payment/', razorpayData),
  getMySubscriptions: () => api.get('/subscriptions/my/'),
};
