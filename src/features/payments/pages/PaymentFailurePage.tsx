import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Typography, Paper, Button, Stack } from '@mui/material'
import { ErrorOutline as ErrorIcon } from '@mui/icons-material'

const PaymentFailurePage: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
        <ErrorIcon color="error" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Payment Failed
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.
        </Typography>
        <Stack spacing={2}>
          <Button variant="contained" component={Link} to="/appointments/my" fullWidth size="large">
            Back to My Appointments
          </Button>
          <Button variant="outlined" component={Link} to="/" fullWidth>
            Back to Home
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}

export default PaymentFailurePage
