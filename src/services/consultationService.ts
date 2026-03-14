import apiClient from './apiClient'
import { ApiResponse } from '../types/api'

interface ConsultationResponse {
    id: string
    appointmentId: string
    patientId: string
    doctorId: string
    startTime: string
    endTime?: string
    status: 'active' | 'completed' | 'cancelled'
    notes?: string
    recordings?: string[]
}

class ConsultationService {
    // Get user's consultations
    async getConsultations(): Promise<ApiResponse<ConsultationResponse[]>> {
        return apiClient.get<ConsultationResponse[]>('/consultations')
    }

    // Get consultation by ID
    async getConsultation(consultationId: string): Promise<ApiResponse<ConsultationResponse>> {
        return apiClient.get<ConsultationResponse>(`/consultations/${consultationId}`)
    }

    // Start consultation
    async startConsultation(appointmentId: string): Promise<ApiResponse<ConsultationResponse>> {
        return apiClient.post<ConsultationResponse>(`/consultations/${appointmentId}/start`)
    }

    // End consultation
    async endConsultation(consultationId: string): Promise<ApiResponse<ConsultationResponse>> {
        return apiClient.put<ConsultationResponse>(`/consultations/${consultationId}/end`)
    }

    // Update consultation notes
    async updateConsultationNotes(consultationId: string, notes: string): Promise<ApiResponse<ConsultationResponse>> {
        return apiClient.put<ConsultationResponse>(`/consultations/${consultationId}/notes`, { notes })
    }

    // Upload consultation media
    async uploadConsultationMedia(consultationId: string, file: File): Promise<ApiResponse> {
        const formData = new FormData()
        formData.append('media', file)

        return apiClient.post(`/consultations/${consultationId}/media`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    }
}

const consultationService = new ConsultationService()
export default consultationService
