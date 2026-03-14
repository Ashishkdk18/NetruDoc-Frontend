import apiClient from './apiClient'
import {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  LoginResponse,
  RegisterResponse,
  UserResponse,
  ApiResponse
} from '../types/api'

class AuthService {
  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', credentials)
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiClient.post<RegisterResponse>('/auth/register', userData)
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    // Clear token on logout
    apiClient.removeAuthToken()
    return response
  }

  async getMe(): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>('/auth/me')
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>('/auth/profile', profileData)
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
    return apiClient.put('/auth/change-password', passwordData)
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return apiClient.put(`/auth/reset-password/${token}`, { password: newPassword })
  }

  // Token management
  setToken(token: string): void {
    apiClient.setAuthToken(token)
  }

  getToken(): string | null {
    return apiClient.getAuthToken()
  }

  removeToken(): void {
    apiClient.removeAuthToken()
  }

  // Check if token exists and is valid
  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      // Basic token validation - you might want to decode and check expiry
      return token.length > 0
    } catch {
      return false
    }
  }
}

const authService = new AuthService()
export default authService
