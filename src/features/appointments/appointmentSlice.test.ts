import { describe, it, expect } from 'vitest'
import appointmentReducer, {
  getAppointments,
  createAppointment,
} from './appointmentSlice'

describe('appointmentSlice', () => {
  it('sets loading=true when fetching appointments (pending)', () => {
    const state = appointmentReducer(undefined, {
      type: getAppointments.pending.type,
    })

    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('stores appointments payload on getAppointments.fulfilled', () => {
    const payload = {
      items: [
        {
          id: 'apt-1',
          patientId: 'pat-1',
          doctorId: 'doc-1',
          date: '2025-02-01',
          time: '10:00',
          status: 'pending',
          reason: 'General checkup',
          preConsultationForm: {
            symptoms: ['Headache'],
            currentMedications: [],
            allergies: [],
            medicalHistory: '',
            additionalNotes: '',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 1,
      },
    }

    const state = appointmentReducer(undefined, {
      type: getAppointments.fulfilled.type,
      payload,
    })

    // State shape is used as a paginated response in the UI
    const stored = state.appointments as any
    expect(stored).toBeTruthy()
    expect(stored.items).toHaveLength(1)
    expect(stored.items[0].id).toBe('apt-1')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets error on getAppointments.rejected', () => {
    const errorMessage = 'Failed to fetch appointments'

    const state = appointmentReducer(undefined, {
      type: getAppointments.rejected.type,
      payload: errorMessage,
    })

    expect(state.loading).toBe(false)
    expect(state.error).toBe(errorMessage)
  })

  it('toggles creating flag during createAppointment lifecycle', () => {
    // Pending
    let state = appointmentReducer(undefined, {
      type: createAppointment.pending.type,
    })
    expect(state.creating).toBe(true)

    // Fulfilled
    state = appointmentReducer(state, {
      type: createAppointment.fulfilled.type,
      payload: {
        id: 'apt-2',
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2025-02-02',
        time: '11:00',
        status: 'pending',
        reason: 'Follow-up',
        preConsultationForm: {
          symptoms: ['Fever'],
          currentMedications: [],
          allergies: [],
          medicalHistory: '',
          additionalNotes: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
    expect(state.creating).toBe(false)
    expect(state.error).toBeNull()

    // Rejected
    state = appointmentReducer(state, {
      type: createAppointment.rejected.type,
      payload: 'Failed to create appointment',
    })
    expect(state.creating).toBe(false)
    expect(state.error).toBe('Failed to create appointment')
  })
})