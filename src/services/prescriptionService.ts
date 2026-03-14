import apiClient from './apiClient'
import { PrescriptionResponse, ApiResponse } from '../types/api'

interface CreatePrescriptionRequest {
  patientId: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
  }>
  diagnoses: string[]
  notes?: string
}

class PrescriptionService {
  // Get user's prescriptions
  async getPrescriptions(): Promise<ApiResponse<PrescriptionResponse[]>> {
    return apiClient.get<PrescriptionResponse[]>('/prescriptions')
  }

  // Get prescription by ID
  async getPrescription(prescriptionId: string): Promise<ApiResponse<PrescriptionResponse>> {
    return apiClient.get<PrescriptionResponse>(`/prescriptions/${prescriptionId}`)
  }

  // Create prescription (Doctor only)
  async createPrescription(prescriptionData: CreatePrescriptionRequest): Promise<ApiResponse<PrescriptionResponse>> {
    return apiClient.post<PrescriptionResponse>('/prescriptions', prescriptionData)
  }

  // Update prescription (Doctor only)
  async updatePrescription(
    prescriptionId: string,
    updateData: Partial<PrescriptionResponse>
  ): Promise<ApiResponse<PrescriptionResponse>> {
    return apiClient.put<PrescriptionResponse>(`/prescriptions/${prescriptionId}`, updateData)
  }

  // Delete prescription (Admin only)
  async deletePrescription(prescriptionId: string): Promise<ApiResponse> {
    return apiClient.delete(`/prescriptions/${prescriptionId}`)
  }

  // Download prescription PDF
  async downloadPrescription(prescriptionId: string): Promise<Blob> {
    const response = await apiClient.get(`/prescriptions/${prescriptionId}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  // Get prescriptions by patient
  async getPrescriptionsByPatient(patientId: string): Promise<ApiResponse<PrescriptionResponse[]>> {
    return apiClient.get<PrescriptionResponse[]>(`/prescriptions?patientId=${patientId}`)
  }

  // Get prescriptions by doctor
  async getPrescriptionsByDoctor(doctorId: string): Promise<ApiResponse<PrescriptionResponse[]>> {
    return apiClient.get<PrescriptionResponse[]>(`/prescriptions?doctorId=${doctorId}`)
  }
}

const prescriptionService = new PrescriptionService()
export default prescriptionService
