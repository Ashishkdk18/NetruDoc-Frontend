import apiClient from './apiClient'
import { PaymentResponse, ApiResponse } from '../types/api'

class PaymentService {
  // Create payment intent
  async createPaymentIntent(appointmentId: string, amount: number): Promise<ApiResponse<{ clientSecret: string }>> {
    return apiClient.post<{ clientSecret: string }>('/payments/create-intent', {
      appointmentId,
      amount,
      currency: 'npr' // or 'usd' based on your needs
    })
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.post<PaymentResponse>('/payments/confirm', {
      paymentIntentId,
      paymentMethodId
    })
  }

  // Get payment history
  async getPaymentHistory(): Promise<ApiResponse<PaymentResponse[]>> {
    return apiClient.get<PaymentResponse[]>('/payments/history')
  }

  // Get payment by ID
  async getPayment(paymentId: string): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.get<PaymentResponse>(`/payments/${paymentId}`)
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<PaymentResponse>> {
    return apiClient.post<PaymentResponse>(`/payments/${paymentId}/refund`, { amount })
  }

  // Handle eSewa payment callback
  async handleEsewaCallback(callbackData: any): Promise<ApiResponse> {
    return apiClient.post('/payments/esewa/callback', callbackData)
  }

  // Get payment methods available
  async getPaymentMethods(): Promise<ApiResponse<{ methods: string[] }>> {
    return apiClient.get<{ methods: string[] }>('/payments/methods')
  }

  // Validate payment
  async validatePayment(paymentId: string): Promise<ApiResponse<{ isValid: boolean }>> {
    return apiClient.post<{ isValid: boolean }>('/payments/validate', { paymentId })
  }
}

const paymentService = new PaymentService()
export default paymentService
