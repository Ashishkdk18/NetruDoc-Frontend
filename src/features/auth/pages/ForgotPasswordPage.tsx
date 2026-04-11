import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { forgotPassword, resetPassword, clearError } from '../authSlice'

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const formik = useFormik({
    initialValues: {
      email: '',
      otp: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      otp: Yup.string().when('step', {
        is: 'otp',
        then: (schema) => schema.required('OTP is required').length(6, 'OTP must be 6 digits'),
      }),
      password: Yup.string().when('step', {
        is: 'reset',
        then: (schema) => schema.min(6, 'Password must be at least 6 characters').required('Password is required'),
      }),
      confirmPassword: Yup.string().when('step', {
        is: 'reset',
        then: (schema) => schema
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .required('Please confirm your password'),
      }),
    }),
    onSubmit: async (values) => {
      if (step === 'email') {
        // Send OTP for password reset
        await handleSendOTP(values.email)
      } else if (step === 'otp') {
        // Verify OTP
        await handleVerifyOTP(values.email, values.otp)
      } else if (step === 'reset') {
        // Reset password (use resetEmail and otpCode from previous steps)
        await handleResetPassword(resetEmail, otpCode, values.password)
      }
    },
  })

  // Handle sending OTP
  const handleSendOTP = async (email: string) => {
    setResetEmail(email)
    const result = await dispatch(forgotPassword(email))
    if (forgotPassword.fulfilled.match(result)) {
      setStep('otp')
      startResendCountdown()
    }
  }

  // Handle OTP verification
  const handleVerifyOTP = async (email: string, otp: string) => {
    try {
      // This would need to be implemented in the auth API
      // For now, we'll assume OTP verification is successful
      console.log('Verifying OTP:', otp, 'for email:', email)
      setStep('reset')
      // await dispatch(verifyPasswordResetOTP({ email, otp }))
    } catch (error) {
      setOtpError('Invalid verification code')
    }
  }

  // Handle password reset
  const handleResetPassword = async (email: string, otp: string, password: string) => {
    const result = await dispatch(resetPassword({ email, otp, password }))
    if (resetPassword.fulfilled.match(result)) {
      setResetSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
  }

  // Handle OTP resend
  const handleResendOTP = async () => {
    setResendDisabled(true)
    startResendCountdown()
    await dispatch(forgotPassword(resetEmail))
  }

  // Start resend countdown
  const startResendCountdown = () => {
    setResendDisabled(true)
    setResendCountdown(60)

    const countdown = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          setResendDisabled(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verify Reset Code'}
          {step === 'reset' && 'Reset Your Password'}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {step === 'email' && 'Enter your email address and we\'ll send you a verification code to reset your password'}
          {step === 'otp' && `We've sent a 6-digit verification code to ${resetEmail}. Please enter it below.`}
          {step === 'reset' && 'Enter your new password below'}
        </Typography>

        {step === 'email' && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 'otp' && otpError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otpError}
          </Alert>
        )}

        {step === 'reset' && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {resetSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset successfully! Redirecting to login page...
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
          {step === 'email' && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Verification Code"
                name="otp"
                value={formik.values.otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  formik.setFieldValue('otp', val);
                  setOtpCode(val);
                  setOtpError('');
                }}
                error={formik.touched.otp && Boolean(formik.errors.otp) || !!otpError}
                helperText={(formik.touched.otp && formik.errors.otp) || otpError}
                inputProps={{ maxLength: 6 }}
                autoFocus
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                <Button
                  variant="text"
                  onClick={() => setStep('email')}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
                <Button
                  variant="text"
                  onClick={handleResendOTP}
                  disabled={resendDisabled}
                  sx={{ textTransform: 'none' }}
                >
                  {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </Button>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2, py: 1.5 }}
                disabled={loading || formik.values.otp.length !== 6}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify & Set New Password'}
              </Button>
            </>
          )}

          {step === 'reset' && !resetSuccess && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </>
          )}

          {step === 'reset' && resetSuccess && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button component={Link} to="/login" variant="contained" sx={{ mt: 2 }}>
                Go to Login
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default ForgotPasswordPage
