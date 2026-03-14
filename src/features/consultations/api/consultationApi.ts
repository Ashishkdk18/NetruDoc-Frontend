import apiClient from '../../../services/apiClient'
import { ApiResponse } from '../../../types/api'

export interface Consultation {
  id?: string
  _id?: string
  appointmentId: any
  patientId: any
  doctorId: any
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  startTime?: string
  endTime?: string
  notes?: string
  diagnosis?: string[]
  symptoms?: string[]
  createdAt?: string
  updatedAt?: string
}

class ConsultationApi {
  async getIceConfig(): Promise<{ iceServers: RTCIceServer[] }> {
    const response = await apiClient.get<{ iceServers: RTCIceServer[] }>(`/consultations/ice-config`)
    return response.data
  }

  async startConsultation(appointmentId: string): Promise<{ consultation: Consultation }> {
    const response = await apiClient.post<{ consultation: Consultation }>(`/consultations/${appointmentId}/start`)
    return response.data
  }

  async getByAppointmentId(
    appointmentId: string
  ): Promise<{ consultation: Consultation | null; appointmentStatus?: string }> {
    const response = await apiClient.get<{ consultation: Consultation | null; appointmentStatus?: string }>(
      `/consultations/appointment/${appointmentId}`
    )
    return response.data
  }

  async getConsultationById(consultationId: string): Promise<ApiResponse<{ consultation: Consultation }>> {
    return apiClient.get<{ consultation: Consultation }>(`/consultations/${consultationId}`)
  }

  async getConsultations(): Promise<ApiResponse<{ items: Consultation[]; pagination?: any }>> {
    return apiClient.get<{ items: Consultation[]; pagination?: any }>('/consultations')
  }

  async updateNotes(consultationId: string, notes: string): Promise<ApiResponse<{ consultation: Consultation }>> {
    return apiClient.put<{ consultation: Consultation }>(`/consultations/${consultationId}/notes`, { notes })
  }

  async updateDiagnosis(consultationId: string, diagnosis: string[]): Promise<ApiResponse<{ consultation: Consultation }>> {
    return apiClient.put<{ consultation: Consultation }>(`/consultations/${consultationId}/diagnosis`, { diagnosis })
  }

  async updateSymptoms(consultationId: string, symptoms: string[]): Promise<ApiResponse<{ consultation: Consultation }>> {
    return apiClient.put<{ consultation: Consultation }>(`/consultations/${consultationId}/symptoms`, { symptoms })
  }
}

const consultationApi = new ConsultationApi()
export default consultationApi

