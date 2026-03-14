import { createSlice } from '@reduxjs/toolkit'

interface PaymentState {
  payments: any[]
  loading: boolean
  error: string | null
}

const initialState: PaymentState = {
  payments: [],
  loading: false,
  error: null,
}

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { clearError } = paymentSlice.actions
export default paymentSlice.reducer
