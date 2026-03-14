import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import userReducer from '../features/users/userSlice'
import appointmentReducer from '../features/appointments/appointmentSlice'
import consultationReducer from '../features/consultations/consultationSlice'
import prescriptionReducer from '../features/prescriptions/prescriptionSlice'
import paymentReducer from '../features/payments/paymentSlice'
import notificationReducer from '../features/notifications/notificationSlice'
import chatReducer from '../features/chat/chatSlice'
import medicalRecordsReducer from '../features/medical-records/medicalRecordsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    appointments: appointmentReducer,
    consultations: consultationReducer,
    prescriptions: prescriptionReducer,
    payments: paymentReducer,
    notifications: notificationReducer,
    chat: chatReducer,
    medicalRecords: medicalRecordsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
