import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  specialization?: string
  experience?: number
  hospital?: string
  consultationFee?: number
  rating?: number
}

interface UserState {
  users: User[]
  doctors: User[]
  currentUser: User | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  users: [],
  doctors: [],
  currentUser: null,
  loading: false,
  error: null,
}

// Get all doctors
export const getDoctors = createAsyncThunk(
  'users/getDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/users/doctors')
      return res.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors')
    }
  }
)

// Get user by ID
export const getUserById = createAsyncThunk(
  'users/getUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/users/${userId}`)
      return res.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user')
    }
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDoctors.pending, (state) => {
        state.loading = true
      })
      .addCase(getDoctors.fulfilled, (state, action) => {
        state.loading = false
        state.doctors = action.payload
        state.error = null
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getUserById.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
        state.error = null
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = userSlice.actions
export default userSlice.reducer
