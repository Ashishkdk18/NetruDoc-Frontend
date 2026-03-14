// Export all services
export { default as apiClient, ApiClient } from './apiClient'
export { default as authService } from './authService'
export { default as userService } from './userService'
export { default as appointmentService } from './appointmentService'
export { default as consultationService } from './consultationService'
export { default as prescriptionService } from './prescriptionService'
export { default as paymentService } from './paymentService'
export { default as notificationService } from './notificationService'
export { default as socketManager, SocketManager } from './socketService'

// Export types
export * from '../types/api'
