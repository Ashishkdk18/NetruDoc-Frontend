import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import consultationApi from './api/consultationApi'
import { Consultation } from './api/consultationApi'

interface ConsultationState {
  consultations: Consultation[]
  currentConsultation: Consultation | null
  loading: boolean
  updatingNotes: boolean
  error: string | null
}

const initialState: ConsultationState = {
  consultations: [],
  currentConsultation: null,
  loading: false,
  updatingNotes: false,
  error: null,
}

// Async thunks
export const getConsultations = createAsyncThunk(
  'consultations/getConsultations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await consultationApi.getConsultations()
      const items = (response.data as any)?.items || (Array.isArray(response.data) ? response.data : [])
      return items
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consultations')
    }
  }
)

export const getConsultationById = createAsyncThunk(
  'consultations/getConsultationById',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const response = await consultationApi.getConsultationById(consultationId)
      return response.data.consultation
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consultation')
    }
  }
)

export const updateNotes = createAsyncThunk(
  'consultations/updateNotes',
  async ({ consultationId, notes }: { consultationId: string; notes: string }, { rejectWithValue }) => {
    try {
      const response = await consultationApi.updateNotes(consultationId, notes)
      return response.data.consultation
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notes')
    }
  }
)

export const updateDiagnosis = createAsyncThunk(
  'consultations/updateDiagnosis',
  async ({ consultationId, diagnosis }: { consultationId: string; diagnosis: string[] }, { rejectWithValue }) => {
    try {
      const response = await consultationApi.updateDiagnosis(consultationId, diagnosis)
      return response.data.consultation
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update diagnosis')
    }
  }
)

export const updateSymptoms = createAsyncThunk(
  'consultations/updateSymptoms',
  async ({ consultationId, symptoms }: { consultationId: string; symptoms: string[] }, { rejectWithValue }) => {
    try {
      const response = await consultationApi.updateSymptoms(consultationId, symptoms)
      return response.data.consultation
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update symptoms')
    }
  }
)

const consultationSlice = createSlice({
  name: 'consultations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentConsultation: (state, action) => {
      state.currentConsultation = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Get consultations
      .addCase(getConsultations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConsultations.fulfilled, (state, action) => {
        state.loading = false
        state.consultations = action.payload
      })
      .addCase(getConsultations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Get consultation by ID
      .addCase(getConsultationById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConsultationById.fulfilled, (state, action) => {
        state.loading = false
        state.currentConsultation = action.payload
      })
      .addCase(getConsultationById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update notes
      .addCase(updateNotes.pending, (state) => {
        state.updatingNotes = true
        state.error = null
      })
      .addCase(updateNotes.fulfilled, (state, action) => {
        state.updatingNotes = false
        state.currentConsultation = action.payload
        // Update in consultations list if present
        const index = state.consultations.findIndex(
          (c) => (c.id || c._id) === (action.payload.id || action.payload._id)
        )
        if (index !== -1) {
          state.consultations[index] = action.payload
        }
      })
      .addCase(updateNotes.rejected, (state, action) => {
        state.updatingNotes = false
        state.error = action.payload as string
      })
      // Update diagnosis
      .addCase(updateDiagnosis.fulfilled, (state, action) => {
        state.currentConsultation = action.payload
        const index = state.consultations.findIndex(
          (c) => (c.id || c._id) === (action.payload.id || action.payload._id)
        )
        if (index !== -1) {
          state.consultations[index] = action.payload
        }
      })
      // Update symptoms
      .addCase(updateSymptoms.fulfilled, (state, action) => {
        state.currentConsultation = action.payload
        const index = state.consultations.findIndex(
          (c) => (c.id || c._id) === (action.payload.id || action.payload._id)
        )
        if (index !== -1) {
          state.consultations[index] = action.payload
        }
      })
  },
})

export const { clearError, setCurrentConsultation } = consultationSlice.actions
export default consultationSlice.reducer
