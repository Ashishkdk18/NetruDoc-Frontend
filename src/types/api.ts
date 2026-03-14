// Standardized API Response Types
export type ApiStatus = 'success' | 'error' | 'warning' | 'info'

export interface ApiResponse<T = any> {
  status: ApiStatus
  message: string
  data: T
}

// Common API response data types
export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'patient' | 'doctor' | 'admin'
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }
}

export interface RegisterResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'patient' | 'doctor' | 'admin'
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: 'patient' | 'doctor' | 'admin'
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  specialization?: string
  experience?: number
  hospital?: string
  consultationFee?: number
  rating?: number
}

export interface AppointmentResponse {
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  reason: string
  notes?: string
}

export interface PrescriptionResponse {
  id: string
  patientId: string
  doctorId: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
  }>
  diagnoses: string[]
  notes?: string
  createdAt: string
}

export interface PaymentResponse {
  id: string
  appointmentId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  transactionId?: string
}

export type NotificationType =
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'appointment_reschedule_requested'
  | 'appointment_reschedule_approved'
  | 'appointment_reschedule_rejected'
  | 'consultation_started'
  | 'consultation_ended'
  | 'prescription_created'
  | 'payment_success'
  | 'payment_failed'
  | 'system_announcement'
  | 'message'
  | 'other'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationResponse {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  readAt?: string
  link?: string
  metadata?: Record<string, any>
  priority?: NotificationPriority
  expiresAt?: string
  createdAt: string
  updatedAt?: string
}

// API Error types
export interface ApiError {
  status: 'error'
  message: string
  data: {
    errors?: Array<{
      field: string
      message: string
    }>
    field?: string
    value?: any
    stack?: string
  }
}

// Request types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'patient' | 'doctor'
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface CreateAppointmentRequest {
  doctorId: string
  date: string
  time: string
  reason: string
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API Configuration
export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// Generic Pagination Types
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface PaginatedApiResponse<T> extends ApiResponse<PaginatedResponse<T>> {}
