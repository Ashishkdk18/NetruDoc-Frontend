import apiClient from './apiClient'
import { UserResponse, ApiResponse } from '../types/api'

class UserService {
  // Get all users (Admin only)
  async getUsers(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>('/users')
  }

  // Get user by ID
  async getUserById(userId: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(`/users/${userId}`)
  }

  // Update user (Admin only)
  async updateUser(userId: string, userData: Partial<UserResponse>): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(`/users/${userId}`, userData)
  }

  // Delete user (Admin only)
  async deleteUser(userId: string): Promise<ApiResponse> {
    return apiClient.delete(`/users/${userId}`)
  }

  // Get all doctors
  async getDoctors(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>('/users/doctors')
  }

  // Get all patients (Admin only)
  async getPatients(): Promise<ApiResponse<UserResponse[]>> {
    return apiClient.get<UserResponse[]>('/users/patients')
  }

  // Search doctors by specialization, location, etc.
  async searchDoctors(params: {
    specialization?: string
    city?: string
    name?: string
  }): Promise<ApiResponse<UserResponse[]>> {
    const queryParams = new URLSearchParams()
    if (params.specialization) queryParams.append('specialization', params.specialization)
    if (params.city) queryParams.append('city', params.city)
    if (params.name) queryParams.append('name', params.name)

    const queryString = queryParams.toString()
    const url = queryString ? `/users/doctors?${queryString}` : '/users/doctors'

    return apiClient.get<UserResponse[]>(url)
  }

  // Get doctor profile with availability
  async getDoctorProfile(doctorId: string): Promise<ApiResponse<UserResponse & { availability?: any }>> {
    return apiClient.get<UserResponse & { availability?: any }>(`/users/${doctorId}`)
  }
}

const userService = new UserService()
export default userService
