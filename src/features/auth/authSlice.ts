import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'
import { authApi } from './api/authApi'
import { AuthState, RegistrationData, LoginCredentials, ProfileUpdate, ChangePasswordData, OTPResponse } from './models/authModels'
import apiClient from '../../services/apiClient'

const initialState: AuthState = {
  user: null,
  token: apiClient.getAuthToken(),
  isAuthenticated: false,
  loading: false,
  error: null,
  success: false,
  message: null,
}


// Load user from token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = apiClient.getAuthToken()
      if (!token) {
        throw new Error('No token found')
      }

      // Decode token to get user info
      const decoded: any = jwtDecode(token)

      // Check if token is expired
      const currentTime = Date.now() / 1000
      if (decoded.exp < currentTime) {
        throw new Error('Token expired')
      }

      const response = await authApi.getMe()
      return response.data.user
    } catch (error: any) {
      apiClient.removeAuthToken()
      return rejectWithValue(error.message || 'Failed to load user')
    }
  }
)

// Register user (US1, US2)
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegistrationData, { rejectWithValue }): Promise<any> => {
    try {
      const response = await authApi.register(userData)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Registration failed')
      }

      // Check if this is an OTP flow response or direct registration response
      // Backend uses standardized response wrapper: { status, message, data: { ... } }
      const responseData: any = response.data

      // Check for direct registration (token/user in data property)
      if (responseData.data && responseData.data.token && responseData.data.user) {
        apiClient.setAuthToken(responseData.data.token)
        return { token: responseData.data.token, user: responseData.data.user }
      } else if (response.message && responseData.email) {
        // OTP flow (email/userId in data property)
        const otpResponse: OTPResponse = {
          otpRequired: true,
          message: response.message,
          email: responseData.email,
          userId: responseData.userId
        }
        return otpResponse
      } else {
        // Unexpected response format
        return rejectWithValue('Unexpected registration response')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed'
      return rejectWithValue(message)
    }
  }
)

// Login user (US3)
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }): Promise<any> => {
    try {
      const response = await authApi.login(credentials)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Login failed')
      }

      // Backend uses standardized response wrapper: { status, message, data: { ... } }
      // apiClient returns response.data which is already the data property
      const responseData: any = response.data

      // Check for direct login (token/user in data property)
      if (responseData.token && responseData.user) {
        // Validate token format (basic JWT check)
        if (!responseData.token.includes('.')) {
          console.error('Invalid token format received:', responseData.token);
          return rejectWithValue('Invalid token received from server');
        }
        apiClient.setAuthToken(responseData.token)
        return { token: responseData.token, user: responseData.user }
      } else if (response.message && responseData.email) {
        // OTP flow required (email/userId in data property)
        const otpResponse: OTPResponse = {
          otpRequired: true,
          message: response.message,
          email: responseData.email,
          userId: responseData.userId
        }
        return otpResponse
      } else {
        // Unexpected response format
        console.error('Unexpected login response:', response)
        return rejectWithValue('Unexpected login response format')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      return rejectWithValue(message)
    }
  }
)

// Update profile (US6)
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: ProfileUpdate, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(profileData)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Profile update failed')
      }

      return response.data.user
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Profile update failed'
      return rejectWithValue(message)
    }
  }
)

// Change password (US6)
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordData, { rejectWithValue }) => {
    try {
      const response = await authApi.changePassword(passwordData)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Password change failed')
      }

      return 'Password updated successfully'
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Password change failed'
      return rejectWithValue(message)
    }
  }
)

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      apiClient.removeAuthToken()
    }
  }
)

// Forgot password (US7)
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword({ email })

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Failed to send reset email')
      }

      return response.message || 'Password reset email sent'
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to send reset email'
      return rejectWithValue(message)
    }
  }
)

// Reset password (US7)
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, otp, password }: { email: string; otp: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.resetPassword(email, otp, password)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Failed to reset password')
      }

      return response.message || 'Password reset successfully'
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to reset password'
      return rejectWithValue(message)
    }
  }
)

// Verify registration OTP
export const verifyRegistrationOTP = createAsyncThunk(
  'auth/verifyRegistrationOTP',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyRegistrationOTP(email, otp)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'OTP verification failed')
      }

      const { token, user } = response.data

      apiClient.setAuthToken(token)

      return { token, user }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed'
      return rejectWithValue(message)
    }
  }
)

// Verify login OTP
export const verifyLoginOTP = createAsyncThunk(
  'auth/verifyLoginOTP',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyLoginOTP(email, otp)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'OTP verification failed')
      }

      const { token, user } = response.data

      apiClient.setAuthToken(token)

      return { token, user }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed'
      return rejectWithValue(message)
    }
  }
)

// Resend OTP
export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApi.resendOTP(email)

      if (response.status === 'error') {
        return rejectWithValue(response.message || 'Failed to resend OTP')
      }

      return response.data.message || 'Verification code sent to your email'
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to resend OTP'
      return rejectWithValue(message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    resetAuthStatus: (state) => {
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        state.error = null
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload as string
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        // Check if this is a direct registration (with token/user) or OTP response
        if (action.payload.token && action.payload.user) {
          state.isAuthenticated = true
          state.user = action.payload.user
          state.token = action.payload.token
          // Clear OTP flags for direct registration
          state.otpRequired = false
          state.otpEmail = null
        } else if (action.payload.otpRequired) {
          // OTP response - set flags for OTP verification
          state.otpRequired = true
          state.otpEmail = action.payload.email
        }
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload as string
        // Clear OTP flags on error
        state.otpRequired = false
        state.otpEmail = null
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        // Check if this is a direct login (with token/user) or OTP response
        if (action.payload.token && action.payload.user) {
          state.isAuthenticated = true
          state.user = action.payload.user
          state.token = action.payload.token
          // Clear OTP flags for direct login
          state.otpRequired = false
          state.otpEmail = null
        } else if (action.payload.otpRequired) {
          // OTP response - set flags for OTP verification
          state.otpRequired = true
          state.otpEmail = action.payload.email
        }
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload as string
        // Clear OTP flags on error
        state.otpRequired = false
        state.otpEmail = null
      })
      // Verify Registration OTP
      .addCase(verifyRegistrationOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyRegistrationOTP.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        // Clear OTP flags after successful verification
        state.otpRequired = false
        state.otpEmail = null
      })
      .addCase(verifyRegistrationOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Verify Login OTP
      .addCase(verifyLoginOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        // Clear OTP flags after successful verification
        state.otpRequired = false
        state.otpEmail = null
      })
      .addCase(verifyLoginOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // Clear OTP flags on error
        state.otpRequired = false
        state.otpEmail = null
      })
      // Resend OTP
      .addCase(resendOTP.pending, (state) => {
        state.loading = true
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.message = action.payload // action.payload is the string message
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.message = action.payload // action.payload is the string message
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = null
      })
  },
})

export const { clearError, setLoading, resetAuthStatus } = authSlice.actions
export default authSlice.reducer
