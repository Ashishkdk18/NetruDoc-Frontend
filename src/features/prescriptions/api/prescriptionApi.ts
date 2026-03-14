import apiClient from '../../../services/apiClient'
import { ApiResponse } from '../../../types/api'
import axios from 'axios'

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Diagnosis {
  condition: string
  icdCode?: string
  notes?: string
}

export interface Prescription {
  id?: string
  _id?: string
  patientId: any
  doctorId: any
  appointmentId?: any
  consultationId?: any
  medications: Medication[]
  diagnoses: Diagnosis[]
  notes?: string
  followUpDate?: string
  isActive: boolean
  pdfUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreatePrescriptionRequest {
  patientId: string
  appointmentId?: string
  consultationId?: string
  medications: Medication[]
  diagnoses: Diagnosis[]
  notes?: string
  followUpDate?: string
}

class PrescriptionApi {
  async getPrescriptions(params?: {
    page?: number
    limit?: number
    sort?: string
    patientId?: string
    doctorId?: string
    appointmentId?: string
  }): Promise<ApiResponse<{ items: Prescription[]; pagination?: any }>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.patientId) queryParams.append('patientId', params.patientId)
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId)
    if (params?.appointmentId) queryParams.append('appointmentId', params.appointmentId)

    const url = `/prescriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<{ items: Prescription[]; pagination?: any }>(url)
  }

  async getPrescriptionById(prescriptionId: string): Promise<ApiResponse<{ prescription: Prescription }>> {
    return apiClient.get<{ prescription: Prescription }>(`/prescriptions/${prescriptionId}`)
  }

  async createPrescription(data: CreatePrescriptionRequest): Promise<ApiResponse<{ prescription: Prescription }>> {
    return apiClient.post<{ prescription: Prescription }>('/prescriptions', data)
  }

  async updatePrescription(
    prescriptionId: string,
    data: Partial<CreatePrescriptionRequest>
  ): Promise<ApiResponse<{ prescription: Prescription }>> {
    return apiClient.put<{ prescription: Prescription }>(`/prescriptions/${prescriptionId}`, data)
  }

  async downloadPrescription(prescriptionId: string): Promise<Blob> {
    // Use raw axios for blob downloads to bypass the apiClient wrapper
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const token = localStorage.getItem('token')
    
    try {
      const response = await axios.get(`${baseURL}/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        validateStatus: (status) => status < 500, // Don't throw on 4xx, we'll handle it
      })
      
      // Check if response is an error (non-2xx status)
      if (response.status >= 400) {
        // Try to parse error message from blob
        if (response.data instanceof Blob) {
          try {
            const text = await response.data.text()
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || `Failed to download prescription (${response.status})`)
          } catch {
            throw new Error(`Failed to download prescription (${response.status})`)
          }
        }
        throw new Error(`Failed to download prescription (${response.status})`)
      }
      
      // Verify we have a valid Blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format: expected Blob')
      }
      
      return response.data
    } catch (error: any) {
      // Re-throw if it's already our error
      if (error.message && error.message.includes('Failed to download')) {
        throw error
      }
      // Handle network errors
      throw new Error(error.message || 'Failed to download prescription')
    }
  }
}

const prescriptionApi = new PrescriptionApi()
export default prescriptionApi
