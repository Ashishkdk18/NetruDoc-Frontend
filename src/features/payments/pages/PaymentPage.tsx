import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Tabs,
  Tab
} from '@mui/material'
import { paymentApi } from '../api/paymentApi'
import StripeCheckout from '../components/StripeCheckout'

interface PaymentLocationState {
  appointmentId: string
  doctorId: string
  doctorName: string
  amount: number
  date: string
  time: string
}

const PaymentPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as PaymentLocationState

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'stripe'>('esewa')

  useEffect(() => {
    if (!state || !state.appointmentId) {
      navigate('/appointments/my')
    }
  }, [state, navigate])

  const handleEsewaPayment = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await paymentApi.initializeEsewaPayment(state.appointmentId, state.amount)

      if (response.status === 'success') {
        const { esewaConfig } = response.data

        const form = document.createElement('form')
        form.setAttribute('method', 'POST')
        form.setAttribute('action', esewaConfig.esewa_url)

        for (const key in esewaConfig) {
          if (key !== 'esewa_url') {
            const hiddenField = document.createElement('input')
            hiddenField.setAttribute('type', 'hidden')
            hiddenField.setAttribute('name', key)
            hiddenField.setAttribute('value', esewaConfig[key])
            form.appendChild(hiddenField)
          }
        }

        document.body.appendChild(form)
        form.submit()
      } else {
        setError(response.message || 'Failed to initialize eSewa payment')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  if (!state) return null

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Complete Payment
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Please complete the payment to confirm your appointment
      </Typography>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Appointment Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Doctor</Typography>
              <Typography fontWeight="medium">Dr. {state.doctorName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Date & Time</Typography>
              <Typography fontWeight="medium">{state.date} at {state.time}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total Amount</Typography>
              <Typography variant="h6" color="primary">Rs. {state.amount}</Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom>
            Select Payment Method
          </Typography>

          <Tabs
            value={paymentMethod}
            onChange={(_, newValue) => setPaymentMethod(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab
              label="eSewa"
              value="esewa"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              label="Credit/Debit Card"
              value="stripe"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>

          {paymentMethod === 'esewa' && (
            <Stack spacing={2}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleEsewaPayment}
                disabled={loading}
                sx={{
                  bgcolor: '#60bb46',
                  '&:hover': { bgcolor: '#50a03a' },
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Pay with eSewa'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/appointments/my')}
                disabled={loading}
              >
                Pay Later
              </Button>
            </Stack>
          )}

          {paymentMethod === 'stripe' && (
            <StripeCheckout
              appointmentId={state.appointmentId}
              amount={state.amount}
              onSuccess={async (paymentIntentId) => {
                // Confirm payment on the backend to update status from pending to completed
                try {
                  await paymentApi.confirmPayment(paymentIntentId);
                } catch (err) {
                  console.error('Failed to confirm payment on backend:', err);
                }
                navigate('/payment/success', {
                  state: {
                    paymentIntentId,
                    appointmentId: state.appointmentId,
                    method: 'stripe'
                  }
                });
              }}
              onError={(error) => {
                setError(error);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Your payment is secure and encrypted.
        </Typography>
      </Box>
    </Container>
  )
}

export default PaymentPage
