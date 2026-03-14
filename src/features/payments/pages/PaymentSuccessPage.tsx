import React, { useEffect, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Container, Typography, Box, Paper, CircularProgress, Button, Alert, Stack } from '@mui/material'
import { CheckCircleOutline as SuccessIcon } from '@mui/icons-material'
import axios from 'axios'

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [isStripeSuccess, setIsStripeSuccess] = useState(false)

  useEffect(() => {
    const verified = searchParams.get('verified')
    const data = searchParams.get('data')
    const errorParam = searchParams.get('error')
    const appointmentIdParam = searchParams.get('appointmentId')
    const paymentIntent = searchParams.get('payment_intent')
    const methodParam = searchParams.get('method')

    // React Router state (e.g. when Stripe completes without redirect)
    const state = location.state as { method?: string; appointmentId?: string; paymentIntentId?: string } | null
    const stateMethod = state?.method
    const stateAppointmentId = state?.appointmentId

    // Appointment ID from URL or from navigation state
    const resolvedAppointmentId = appointmentIdParam || stateAppointmentId || null
    setAppointmentId(resolvedAppointmentId)

    // Stripe success: from URL (redirect) or from location state (in-app completion)
    const stripeSuccessFromUrl = methodParam === 'stripe' && paymentIntent
    const stripeSuccessFromState = stateMethod === 'stripe' && (stateAppointmentId || paymentIntent)
    if (stripeSuccessFromUrl || stripeSuccessFromState) {
      setIsStripeSuccess(true)
      setLoading(false)
      return
    }

    // Backend redirect with verified=1 means payment was already processed (eSewa)
    if (verified === '1') {
      setLoading(false)
      return
    }

    // Backend redirect with error
    if (errorParam) {
      setError(
        errorParam === 'no_data'
          ? 'No payment data received from eSewa. Please check your appointment list.'
          : 'Payment verification failed. Please check your appointment list.'
      )
      setLoading(false)
      return
    }

    // Direct flow: data in URL (legacy or when eSewa uses GET redirect)
    if (data) {
      verifyPayment(data)
    } else if (!paymentIntent && !stripeSuccessFromState) {
      setError('No payment data found in URL. If you just completed payment, please check your appointment list.')
      setLoading(false)
    }
  }, [searchParams, location.state])

  const verifyPayment = async (encodedData: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/payments/esewa/callback?data=${encodedData}`)

      if (response.data.status === 'success') {
        setLoading(false)
      } else {
        setError(response.data.message || 'Payment verification failed')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Payment verification error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to verify payment')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 4 }}>
          Verifying your payment...
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
        {error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Typography variant="body1" sx={{ mb: 4 }}>
              There was an issue verifying your payment. Please check your appointment list to see the status.
            </Typography>
            <Button variant="contained" component={Link} to="/appointments/my" fullWidth>
              My Appointments
            </Button>
          </Box>
        ) : (
          <Box>
            <SuccessIcon color="success" sx={{ fontSize: 100, mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your appointment has been successfully booked and payment is confirmed.
              {(searchParams.get('method') === 'stripe' || isStripeSuccess) && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="primary">
                    Paid securely with credit/debit card
                  </Typography>
                </Box>
              )}
            </Typography>
            <Stack spacing={2}>
              {appointmentId && (
                <Button variant="contained" component={Link} to={`/appointments/${appointmentId}`} fullWidth size="large" color="primary">
                  View Appointment Details
                </Button>
              )}
              <Button variant="contained" component={Link} to="/appointments/my" fullWidth size="large" color={appointmentId ? "secondary" : "primary"}>
                View My Appointments
              </Button>
              <Button variant="outlined" component={Link} to="/" fullWidth>
                Back to Home
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default PaymentSuccessPage
