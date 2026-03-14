import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import prescriptionApi, { Prescription, CreatePrescriptionRequest } from './api/prescriptionApi'

interface PrescriptionState {
  prescriptions: Prescription[]
  currentPrescription: Prescription | null
  loading: boolean
  creating: boolean
  updating: boolean
  downloading: boolean
  error: string | null
}

const initialState: PrescriptionState = {
  prescriptions: [],
  currentPrescription: null,
  loading: false,
  creating: false,
  updating: false,
  downloading: false,
  error: null,
}

// Async thunks
export const getPrescriptions = createAsyncThunk(
  'prescriptions/getPrescriptions',
  async (params: { page?: number; limit?: number; sort?: string; patientId?: string; doctorId?: string; appointmentId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await prescriptionApi.getPrescriptions(params)
      const items = (response.data as any)?.items || (Array.isArray(response.data) ? response.data : [])
      return { items, pagination: (response.data as any)?.pagination }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prescriptions')
    }
  }
)

export const getPrescriptionById = createAsyncThunk(
  'prescriptions/getPrescriptionById',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const response = await prescriptionApi.getPrescriptionById(prescriptionId)
      return response.data.prescription
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prescription')
    }
  }
)

export const createPrescription = createAsyncThunk(
  'prescriptions/createPrescription',
  async (data: CreatePrescriptionRequest, { rejectWithValue }) => {
    try {
      const response = await prescriptionApi.createPrescription(data)
      return response.data.prescription
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create prescription')
    }
  }
)

export const updatePrescription = createAsyncThunk(
  'prescriptions/updatePrescription',
  async ({ prescriptionId, data }: { prescriptionId: string; data: Partial<CreatePrescriptionRequest> }, { rejectWithValue }) => {
    try {
      const response = await prescriptionApi.updatePrescription(prescriptionId, data)
      return response.data.prescription
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update prescription')
    }
  }
)

export const downloadPrescription = createAsyncThunk(
  'prescriptions/downloadPrescription',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const blob = await prescriptionApi.downloadPrescription(prescriptionId)
      
      // Verify we have a valid Blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response: expected Blob but received ' + typeof blob)
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `prescription-${prescriptionId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return prescriptionId
    } catch (error: any) {
      console.error('Failed to download prescription:', error)
      return rejectWithValue(error.message || 'Failed to download prescription')
    }
  }
)

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentPrescription: (state, action) => {
      state.currentPrescription = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Get prescriptions
      .addCase(getPrescriptions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPrescriptions.fulfilled, (state, action) => {
        state.loading = false
        state.prescriptions = action.payload.items
      })
      .addCase(getPrescriptions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Get prescription by ID
      .addCase(getPrescriptionById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPrescriptionById.fulfilled, (state, action) => {
        state.loading = false
        state.currentPrescription = action.payload
      })
      .addCase(getPrescriptionById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create prescription
      .addCase(createPrescription.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createPrescription.fulfilled, (state, action) => {
        state.creating = false
        state.currentPrescription = action.payload
        state.prescriptions.unshift(action.payload)
      })
      .addCase(createPrescription.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload as string
      })
      // Update prescription
      .addCase(updatePrescription.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(updatePrescription.fulfilled, (state, action) => {
        state.updating = false
        state.currentPrescription = action.payload
        const index = state.prescriptions.findIndex(
          (p) => (p.id || p._id) === (action.payload.id || action.payload._id)
        )
        if (index !== -1) {
          state.prescriptions[index] = action.payload
        }
      })
      .addCase(updatePrescription.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })
      // Download prescription
      .addCase(downloadPrescription.pending, (state) => {
        state.downloading = true
        state.error = null
      })
      .addCase(downloadPrescription.fulfilled, (state) => {
        state.downloading = false
      })
      .addCase(downloadPrescription.rejected, (state, action) => {
        state.downloading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, setCurrentPrescription } = prescriptionSlice.actions
export default prescriptionSlice.reducer

