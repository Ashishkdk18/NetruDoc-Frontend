import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import medicalRecordsApi from './api/medicalRecordsApi'
import { MedicalRecordsResponse } from './types/medicalRecordsTypes'

interface MedicalRecordsState {
  records: MedicalRecordsResponse | null
  loading: boolean
  error: string | null
}

const initialState: MedicalRecordsState = {
  records: null,
  loading: false,
  error: null,
}

export const getMedicalRecords = createAsyncThunk(
  'medicalRecords/getMedicalRecords',
  async (patientId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await medicalRecordsApi.getMedicalRecords(patientId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch medical records')
    }
  }
)

const medicalRecordsSlice = createSlice({
  name: 'medicalRecords',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearRecords: (state) => {
      state.records = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMedicalRecords.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMedicalRecords.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(getMedicalRecords.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearRecords } = medicalRecordsSlice.actions
export default medicalRecordsSlice.reducer
