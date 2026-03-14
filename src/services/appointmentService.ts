import apiClient from './apiClient'
import {
  AppointmentResponse,
  CreateAppointmentRequest,
  ApiResponse
} from '../types/api'

class AppointmentService {
  // Get user's appointments
  async getAppointments(): Promise<ApiResponse<AppointmentResponse[]>> {
    return apiClient.get<AppointmentResponse[]>('/appointments')
  }

  // Get appointment by ID
  async getAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    return apiClient.get<AppointmentResponse>(`/appointments/${appointmentId}`)
  }

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<AppointmentResponse>> {
    return apiClient.post<AppointmentResponse>('/appointments', appointmentData)
  }

  // Update appointment
  async updateAppointment(
    appointmentId: string,
    updateData: Partial<AppointmentResponse>
  ): Promise<ApiResponse<AppointmentResponse>> {
    return apiClient.put<AppointmentResponse>(`/appointments/${appointmentId}`, updateData)
  }

  // Delete appointment
  async deleteAppointment(appointmentId: string): Promise<ApiResponse> {
    return apiClient.delete(`/appointments/${appointmentId}`)
  }

  // Get available slots for a doctor
  async getAvailableSlots(doctorId: string, date?: string): Promise<ApiResponse<{ date: string; slots: string[] }[]>> {
    const params = date ? { date } : {}
    return apiClient.get<{ date: string; slots: string[] }[]>(`/appointments/available-slots/${doctorId}`, { params })
  }

  // Confirm appointment (Doctor only)
  async confirmAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    return apiClient.put<AppointmentResponse>(`/appointments/${appointmentId}/confirm`)
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse<AppointmentResponse>> {
    return apiClient.put<AppointmentResponse>(`/appointments/${appointmentId}/cancel`, { reason })
  }

  // Get appointments by status
  async getAppointmentsByStatus(status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<ApiResponse<AppointmentResponse[]>> {
    return apiClient.get<AppointmentResponse[]>(`/appointments?status=${status}`)
  }

  // Get appointments by date range
  async getAppointmentsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<AppointmentResponse[]>> {
    return apiClient.get<AppointmentResponse[]>(`/appointments?startDate=${startDate}&endDate=${endDate}`)
  }

  // Get doctor's appointments (Doctor only)
  async getDoctorAppointments(): Promise<ApiResponse<AppointmentResponse[]>> {
    return apiClient.get<AppointmentResponse[]>('/appointments/doctor')
  }

  // Get patient's appointments (Patient only)
  async getPatientAppointments(): Promise<ApiResponse<AppointmentResponse[]>> {
    return apiClient.get<AppointmentResponse[]>('/appointments/patient')
  }
}

const appointmentService = new AppointmentService()
export default appointmentService
