/**
 * User API Service
 * Handles all user-related API calls
 * Separated from UI logic
 */

import apiClient from '../../../services/apiClient'
import { ApiResponse, PaginatedApiResponse } from '../../../types/api'
import { User } from '../models/userModels'

class UserApi {
  private readonly basePath = '/users'

  /**
   * Get all users (Admin only) - US8
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isActive?: boolean
  }): Promise<PaginatedApiResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())

    const queryString = queryParams.toString()
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath

    return apiClient.get(url)
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>(`${this.basePath}/${userId}`)
  }

  /**
   * Update user (Admin only) - US8
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`${this.basePath}/${userId}`, userData)
  }

  /**
   * Delete user (Admin only) - US8
   */
  async deleteUser(userId: string): Promise<ApiResponse> {
    return apiClient.delete(`${this.basePath}/${userId}`)
  }

  /**
   * Activate user account (Admin only) - US8
   */
  async activateUser(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`${this.basePath}/${userId}/activate`)
  }

  /**
   * Deactivate user account (Admin only) - US8
   */
  async deactivateUser(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`${this.basePath}/${userId}/deactivate`)
  }

  /**
   * Get all doctors (with filters and pagination)
   */
  async getDoctors(params?: {
    page?: number
    limit?: number
    specialization?: string
    search?: string
    sort?: string
    hospitalId?: string
    minExperience?: number
    maxFee?: number
    availabilityDate?: string
  }): Promise<PaginatedApiResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.specialization) queryParams.append('specialization', params.specialization)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.hospitalId) queryParams.append('hospitalId', params.hospitalId)
    if (params?.minExperience != null) queryParams.append('minExperience', params.minExperience.toString())
    if (params?.maxFee != null) queryParams.append('maxFee', params.maxFee.toString())
    if (params?.availabilityDate) queryParams.append('availabilityDate', params.availabilityDate)

    const queryString = queryParams.toString()
    const url = queryString ? `${this.basePath}/doctors?${queryString}` : `${this.basePath}/doctors`

    return apiClient.get(url)
  }

  /**
   * Get all patients (Admin only)
   */
  async getPatients(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedApiResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)

    const queryString = queryParams.toString()
    const url = queryString ? `${this.basePath}/patients?${queryString}` : `${this.basePath}/patients`

    return apiClient.get(url)
  }

  /**
   * Get doctor availability (Doctor only)
   */
  async getDoctorAvailability(): Promise<ApiResponse<{ availability: any }>> {
    return apiClient.get<{ availability: any }>(`${this.basePath}/doctor/availability`)
  }

  /**
   * Update doctor availability (Doctor only)
   */
  async updateDoctorAvailability(availability: any): Promise<ApiResponse<{ availability: any }>> {
    return apiClient.put<{ availability: any }>(`${this.basePath}/doctor/availability`, { availability })
  }
}

export const userApi = new UserApi()
export default userApi
