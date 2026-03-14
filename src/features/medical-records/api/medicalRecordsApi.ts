import apiClient from '../../../services/apiClient'
import { ApiResponse } from '../../../types/api'
import { MedicalRecordsResponse } from '../types/medicalRecordsTypes'

class MedicalRecordsApi {
  async getMedicalRecords(patientId?: string): Promise<ApiResponse<MedicalRecordsResponse>> {
    const url = patientId ? `/medical-records/${patientId}` : '/medical-records'
    return apiClient.get<MedicalRecordsResponse>(url)
  }
}

const medicalRecordsApi = new MedicalRecordsApi()
export default medicalRecordsApi
