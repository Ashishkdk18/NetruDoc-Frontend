/**
 * Auth API Service
 * Handles all authentication-related API calls
 * Separated from UI logic
 */

import apiClient from '../../../services/apiClient'
import { ApiResponse } from '../../../types/api'
import {
  RegistrationData,
  LoginCredentials,
  LoginResponse,
  User,
  ProfileUpdate,
  ChangePasswordData,
  ForgotPasswordData,

} from '../models/authModels'

class AuthApi {
  private readonly basePath = '/auth'

  /**
   * Register new user (US1, US2)
   */
  async register(data: RegistrationData): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(`${this.basePath}/register`, data)
  }

  /**
   * Login user (US3)
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(`${this.basePath}/login`, credentials)
  }

  /**
   * Get current user profile (US5)
   */
  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>(`${this.basePath}/me`)
  }

  /**
   * Update user profile (US6)
   */
  async updateProfile(data: ProfileUpdate): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`${this.basePath}/profile`, data)
  }

  /**
   * Change password (US6)
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    return apiClient.put(`${this.basePath}/change-password`, data)
  }

  /**
   * Forgot password (US7)
   */
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    return apiClient.post(`${this.basePath}/forgot-password`, data)
  }

  /**
   * Reset password (US7)
   */
  async resetPassword(email: string, otp: string, password: string): Promise<ApiResponse> {
    return apiClient.put(`${this.basePath}/reset-password`, { email, otp, password })
  }

  /**
   * Verify registration OTP
   */
  async verifyRegistrationOTP(email: string, otp: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(`${this.basePath}/verify-registration-otp`, { email, otp })
  }

  /**
   * Verify login OTP
   */
  async verifyLoginOTP(email: string, otp: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(`${this.basePath}/verify-login-otp`, { email, otp })
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`${this.basePath}/resend-otp`, { email })
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post(`${this.basePath}/logout`)
    // Clear token on logout
    apiClient.removeAuthToken()
    return response
  }
}

export const authApi = new AuthApi()
export default authApi
