import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const paymentApi = {
  // eSewa payment methods
  initializeEsewaPayment: async (appointmentId: string, amount?: number) => {
    const response = await apiClient.post('/payments/esewa/initialize', { appointmentId, amount });
    return response.data;
  },

  // Stripe payment methods
  createPaymentIntent: async (appointmentId: string, amount?: number) => {
    const response = await apiClient.post('/payments/create-intent', { appointmentId, amount });
    return response.data;
  },
  confirmPayment: async (paymentIntentId: string, paymentMethodId?: string) => {
    const response = await apiClient.post('/payments/confirm', { paymentIntentId, paymentMethodId });
    return response.data;
  },

  // Common payment methods
  getPaymentHistory: async (params: any) => {
    const response = await apiClient.get('/payments/history', { params });
    return response.data;
  },
  getPaymentById: async (id: string) => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },
};

export default paymentApi;
