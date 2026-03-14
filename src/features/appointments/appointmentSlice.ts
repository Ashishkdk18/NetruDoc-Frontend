import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import appointmentApi from './api/appointmentApi'

// Enhanced Appointment interface
export interface PreConsultationForm {
  symptoms: string[]
  currentMedications: string[]
  allergies: string[]
  medicalHistory: string
  additionalNotes: string
}

export interface RescheduleInfo {
  rescheduleRequestedAt: string
  rescheduleRequestedBy: string
  rescheduleReason: string
  rescheduleStatus: 'none' | 'pending' | 'approved' | 'rejected'
  rescheduleNewDate: string
  rescheduleNewTime: string
  rescheduleApprovedAt?: string
  rescheduleApprovedBy?: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  reason: string
  notes?: string
  preConsultationForm: PreConsultationForm
  rescheduleRequestedAt?: string
  rescheduleRequestedBy?: string
  rescheduleReason?: string
  rescheduleStatus: 'none' | 'pending' | 'approved' | 'rejected'
  rescheduleNewDate?: string
  rescheduleNewTime?: string
  rescheduleApprovedAt?: string
  rescheduleApprovedBy?: string
  consultationId?: string
  prescriptionId?: string
  paymentId?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

// Request/Response interfaces
interface CreateAppointmentRequest {
  doctorId: string
  date: string
  time: string
  reason: string
  notes?: string
  preConsultationForm: PreConsultationForm
}

interface UpdateAppointmentRequest {
  date?: string
  time?: string
  reason?: string
  notes?: string
  preConsultationForm?: PreConsultationForm
}

interface RescheduleAppointmentRequest {
  newDate: string
  newTime: string
  reason: string
}

// Enhanced state interface
interface AppointmentState {
  appointments: any // Changed to any to handle both array and paginated object formats used in the slice
  patientAppointments: any // Appointments for a specific patient (used by admin)
  currentAppointment: Appointment | null
  availableSlots: string[]
  doctorSchedule: Appointment[]
  loading: boolean
  loadingPatientAppointments: boolean
  loadingSlots: boolean
  loadingSchedule: boolean
  creating: boolean
  updating: boolean
  cancelling: boolean
  rescheduling: boolean
  confirming: boolean
  deleting: boolean
  error: string | null
  slotsError: string | null
  scheduleError: string | null
}

const initialState: AppointmentState = {
  appointments: [],
  patientAppointments: null,
  currentAppointment: null,
  availableSlots: [],
  doctorSchedule: [],
  loading: false,
  loadingPatientAppointments: false,
  loadingSlots: false,
  loadingSchedule: false,
  creating: false,
  updating: false,
  cancelling: false,
  rescheduling: false,
  confirming: false,
  deleting: false,
  error: null,
  slotsError: null,
  scheduleError: null,
}

// Async thunks
export const getAppointments = createAsyncThunk(
  'appointments/getAppointments',
  async (params: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
    rescheduleStatus?: 'pending' | 'approved' | 'rejected' | 'none'
  } | undefined, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.getAppointments(params)
      return response.data
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch appointments'
      return rejectWithValue(message)
    }
  }
)

export const getAppointmentById = createAsyncThunk(
  'appointments/getAppointmentById',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.getAppointment(appointmentId)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch appointment'
      return rejectWithValue(message)
    }
  }
)

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: CreateAppointmentRequest, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.createAppointment(appointmentData)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to create appointment'
      return rejectWithValue(message)
    }
  }
)

export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ appointmentId, updateData }: { appointmentId: string; updateData: UpdateAppointmentRequest }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.updateAppointment(appointmentId, updateData)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to update appointment'
      return rejectWithValue(message)
    }
  }
)

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async ({ appointmentId, reason }: { appointmentId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.cancelAppointment(appointmentId, reason)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to cancel appointment'
      return rejectWithValue(message)
    }
  }
)

export const confirmAppointment = createAsyncThunk(
  'appointments/confirmAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.confirmAppointment(appointmentId)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to confirm appointment'
      return rejectWithValue(message)
    }
  }
)

export const requestReschedule = createAsyncThunk(
  'appointments/requestReschedule',
  async ({ appointmentId, rescheduleData }: { appointmentId: string; rescheduleData: RescheduleAppointmentRequest }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.requestReschedule(appointmentId, rescheduleData)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to request reschedule'
      return rejectWithValue(message)
    }
  }
)

export const handleRescheduleRequest = createAsyncThunk(
  'appointments/handleRescheduleRequest',
  async ({ appointmentId, action }: { appointmentId: string; action: 'approve' | 'reject' }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.handleRescheduleRequest(appointmentId, action)
      return response.data.appointment
    } catch (error: any) {
      const message = error?.message || 'Failed to handle reschedule request'
      return rejectWithValue(message)
    }
  }
)

export const getPatientAppointmentsByAdmin = createAsyncThunk(
  'appointments/getPatientAppointmentsByAdmin',
  async ({ patientId, params }: { patientId: string; params?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  } }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.getPatientAppointmentsByAdmin(patientId, params)
      return response.data
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch patient appointments'
      return rejectWithValue(message)
    }
  }
)

export const deleteAppointment = createAsyncThunk(
  'appointments/deleteAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      await appointmentApi.deleteAppointment(appointmentId)
      return appointmentId
    } catch (error: any) {
      const message = error?.message || 'Failed to delete appointment'
      return rejectWithValue(message)
    }
  }
)

export const getAvailableSlots = createAsyncThunk(
  'appointments/getAvailableSlots',
  async ({ doctorId, date }: { doctorId: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.getAvailableSlots(doctorId, date)
      return response.data.slots
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch available slots'
      return rejectWithValue(message)
    }
  }
)

export const getDoctorSchedule = createAsyncThunk(
  'appointments/getDoctorSchedule',
  async ({ startDate, endDate }: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await appointmentApi.getDoctorSchedule(startDate, endDate)
      return response.data.appointments
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch doctor schedule'
      return rejectWithValue(message)
    }
  }
)

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.slotsError = null
      state.scheduleError = null
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Get appointments
      .addCase(getAppointments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAppointments.fulfilled, (state, action) => {
        state.loading = false
        state.appointments = action.payload
        state.error = null
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Get appointment by ID
      .addCase(getAppointmentById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAppointmentById.fulfilled, (state, action) => {
        state.loading = false
        state.currentAppointment = action.payload
        state.error = null
      })
      .addCase(getAppointmentById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.creating = false
        if (state.appointments?.items) {
          state.appointments.items.unshift(action.payload)
        } else if (Array.isArray(state.appointments)) {
          state.appointments.unshift(action.payload)
        }
        state.error = null
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload as string
      })

      // Update appointment
      .addCase(updateAppointment.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.updating = false
        const appointmentList = state.appointments?.items || state.appointments || []
        const index = Array.isArray(appointmentList) 
          ? appointmentList.findIndex((apt: any) => apt.id === action.payload.id)
          : -1

        if (index !== -1) {
          if (state.appointments?.items) {
            state.appointments.items[index] = action.payload
          } else if (Array.isArray(state.appointments)) {
            state.appointments[index] = action.payload
          }
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload
        }
        state.error = null
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      // Cancel appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.cancelling = true
        state.error = null
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.cancelling = false
        const appointmentList = state.appointments?.items || state.appointments || []
        const index = Array.isArray(appointmentList) 
          ? appointmentList.findIndex((apt: any) => apt.id === action.payload.id)
          : -1

        if (index !== -1) {
          if (state.appointments?.items) {
            state.appointments.items[index] = action.payload
          } else if (Array.isArray(state.appointments)) {
            state.appointments[index] = action.payload
          }
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload
        }
        state.error = null
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.cancelling = false
        state.error = action.payload as string
      })

      // Confirm appointment
      .addCase(confirmAppointment.pending, (state) => {
        state.confirming = true
        state.error = null
      })
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        state.confirming = false
        const appointmentList = state.appointments?.items || state.appointments || []
        const index = Array.isArray(appointmentList) 
          ? appointmentList.findIndex((apt: any) => apt.id === action.payload.id)
          : -1

        if (index !== -1) {
          if (state.appointments?.items) {
            state.appointments.items[index] = action.payload
          } else if (Array.isArray(state.appointments)) {
            state.appointments[index] = action.payload
          }
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload
        }
        state.error = null
      })
      .addCase(confirmAppointment.rejected, (state, action) => {
        state.confirming = false
        state.error = action.payload as string
      })

      // Request reschedule
      .addCase(requestReschedule.pending, (state) => {
        state.rescheduling = true
        state.error = null
      })
      .addCase(requestReschedule.fulfilled, (state, action) => {
        state.rescheduling = false
        // Handle both paginated and array structures
        const appointmentList = state.appointments?.items || state.appointments || []
        const index = Array.isArray(appointmentList) 
          ? appointmentList.findIndex((apt: any) => apt.id === action.payload.id)
          : -1

        if (index !== -1) {
          if (state.appointments?.items) {
            state.appointments.items[index] = action.payload
          } else if (Array.isArray(state.appointments)) {
            state.appointments[index] = action.payload
          }
        }
        
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload
        }
        state.error = null
      })
      .addCase(requestReschedule.rejected, (state, action) => {
        state.rescheduling = false
        state.error = action.payload as string
      })

      // Handle reschedule request
      .addCase(handleRescheduleRequest.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(handleRescheduleRequest.fulfilled, (state, action) => {
        state.updating = false
        const appointmentList = state.appointments?.items || state.appointments || []
        const index = Array.isArray(appointmentList) 
          ? appointmentList.findIndex((apt: any) => apt.id === action.payload.id)
          : -1

        if (index !== -1) {
          if (state.appointments?.items) {
            state.appointments.items[index] = action.payload
          } else if (Array.isArray(state.appointments)) {
            state.appointments[index] = action.payload
          }
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload
        }
        state.error = null
      })
      .addCase(handleRescheduleRequest.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      // Get available slots
      .addCase(getAvailableSlots.pending, (state) => {
        state.loadingSlots = true
        state.slotsError = null
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.loadingSlots = false
        state.availableSlots = action.payload
        state.slotsError = null
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.loadingSlots = false
        state.slotsError = action.payload as string
      })

      // Get doctor schedule
      .addCase(getDoctorSchedule.pending, (state) => {
        state.loadingSchedule = true
        state.scheduleError = null
      })
      .addCase(getDoctorSchedule.fulfilled, (state, action) => {
        state.loadingSchedule = false
        state.doctorSchedule = action.payload
        state.scheduleError = null
      })
      .addCase(getDoctorSchedule.rejected, (state, action) => {
        state.loadingSchedule = false
        state.scheduleError = action.payload as string
      })

      // Delete appointment
      .addCase(deleteAppointment.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.updating = false
        // Remove the deleted appointment from the list
        if (state.appointments?.items) {
          state.appointments.items = state.appointments.items.filter((apt: { id: string }) => apt.id !== action.payload)
        }
        if (state.currentAppointment?.id === action.payload) {
          state.currentAppointment = null
        }
        state.error = null
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      // Get patient appointments by admin
      .addCase(getPatientAppointmentsByAdmin.pending, (state) => {
        state.loadingPatientAppointments = true
        state.error = null
      })
      .addCase(getPatientAppointmentsByAdmin.fulfilled, (state, action) => {
        state.loadingPatientAppointments = false
        state.patientAppointments = action.payload
        state.error = null
      })
      .addCase(getPatientAppointmentsByAdmin.rejected, (state, action) => {
        state.loadingPatientAppointments = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentAppointment, clearAvailableSlots } = appointmentSlice.actions
export default appointmentSlice.reducer
