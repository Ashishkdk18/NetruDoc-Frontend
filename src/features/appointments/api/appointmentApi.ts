import apiClient from '../../../services/apiClient'

// Types
export interface PreConsultationForm {
  symptoms: string[]
  currentMedications: string[]
  allergies: string[]
  medicalHistory: string
  additionalNotes: string
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
  preConsultationForm: PreConsultationForm
  rescheduleRequestedAt?: string
  rescheduleRequestedBy?: string
  rescheduleReason?: string
  rescheduleStatus: 'none' | 'pending' | 'approved' | 'rejected'
  rescheduleNewDate?: string
  rescheduleNewTime?: string
  rescheduleApprovedAt?: string
  rescheduleApprovedBy?: string
  consultationId?: string
  prescriptionId?: string
  paymentId?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentRequest {
  doctorId: string
  date: string
  time: string
  reason: string
  notes?: string
  preConsultationForm: PreConsultationForm
}

export interface UpdateAppointmentRequest {
  date?: string
  time?: string
  reason?: string
  notes?: string
  preConsultationForm?: PreConsultationForm
}

export interface CancelAppointmentRequest {
  reason?: string
}

export interface RescheduleAppointmentRequest {
  newDate: string
  newTime: string
  reason: string
}

export interface HandleRescheduleRequest {
  action: 'approve' | 'reject'
}

export interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems: number
  }
}

class AppointmentApi {
  // Get user's appointments (filtered by role)
  async getAppointments(params?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
    rescheduleStatus?: 'pending' | 'approved' | 'rejected' | 'none'
  }): Promise<ApiResponse<PaginatedResponse<AppointmentResponse>>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.rescheduleStatus) queryParams.append('rescheduleStatus', params.rescheduleStatus)

    return apiClient.get<PaginatedResponse<AppointmentResponse>>(`/appointments?${queryParams.toString()}`)
  }

  // Get appointment by ID
  async getAppointment(appointmentId: string): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.get<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}`)
  }

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.post<{ appointment: AppointmentResponse }>('/appointments', appointmentData)
  }

  // Update appointment
  async updateAppointment(
    appointmentId: string,
    updateData: UpdateAppointmentRequest
  ): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.put<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}`, updateData)
  }

  // Delete appointment (admin only)
  async deleteAppointment(appointmentId: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete<unknown>(`/appointments/${appointmentId}`)
  }

  // Get available time slots for a doctor
  async getAvailableSlots(doctorId: string, date?: string): Promise<ApiResponse<{ slots: string[] }>> {
    const params = date ? { date } : {}
    return apiClient.get<{ slots: string[] }>(`/appointments/available-slots/${doctorId}`, { params })
  }

  // Confirm appointment (doctor only)
  async confirmAppointment(appointmentId: string): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.put<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}/confirm`)
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.put<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}/cancel`, { reason })
  }

  // Request reschedule appointment
  async requestReschedule(
    appointmentId: string,
    rescheduleData: RescheduleAppointmentRequest
  ): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.put<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}/reschedule`, rescheduleData)
  }

  // Handle reschedule request (doctor/admin only)
  async handleRescheduleRequest(
    appointmentId: string,
    action: 'approve' | 'reject'
  ): Promise<ApiResponse<{ appointment: AppointmentResponse }>> {
    return apiClient.put<{ appointment: AppointmentResponse }>(`/appointments/${appointmentId}/handle-reschedule`, { action })
  }

  // Get doctor's schedule (doctor only)
  async getDoctorSchedule(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ appointments: AppointmentResponse[] }>> {
    const params = { startDate, endDate }
    return apiClient.get<{ appointments: AppointmentResponse[] }>('/appointments/doctor/schedule', { params })
  }

  // Get patient appointment history (patient only)
  async getPatientHistory(params?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<AppointmentResponse>>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    return apiClient.get<PaginatedResponse<AppointmentResponse>>(`/appointments/patient/history?${queryParams.toString()}`)
  }

  // Get patient appointments by admin (admin only)
  async getPatientAppointmentsByAdmin(patientId: string, params?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<AppointmentResponse>>> {
    const queryParams = new URLSearchParams()
    queryParams.append('patientId', patientId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    return apiClient.get<PaginatedResponse<AppointmentResponse>>(`/appointments?${queryParams.toString()}`)
  }
}

const appointmentApi = new AppointmentApi()
export default appointmentApi