import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
import { login, verifyLoginOTP, verifyRegistrationOTP, resendOTP, clearError } from '../authSlice'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()

  const { loading, error, isAuthenticated, user, otpRequired } = useSelector((state: RootState) => state.auth)

  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [loginEmail, setLoginEmail] = useState('')
  const [otpType, setOtpType] = useState<'registration' | 'login'>('login')

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate, from])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      if (otpStep) {
        // Handle OTP verification
        await handleOTPVerification(values.email)
      } else {
        // Handle initial login (email/password validation)
        await handleInitialLogin(values)
      }
    },
  })

  // Handle successful initial login (switch to OTP step)
  useEffect(() => {
    if (otpRequired && !otpStep) {
      // Login was successful but requires OTP verification, switch to OTP step
      setOtpStep(true)
      // Set OTP type to 'registration' for unverified email scenarios
      setOtpType('registration')
    }
  }, [otpRequired, otpStep])

  // Handle initial login (email/password validation)
  const handleInitialLogin = async (values: typeof formik.values) => {
    try {
      setLoginEmail(values.email)
      await dispatch(login(values)).unwrap()
    } catch (error) {
      // Error is already handled by Redux, but ensure loading is reset
      console.error('Login error:', error)
    }
  }

  // Handle OTP verification
  const handleOTPVerification = async (email: string) => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the verification code')
      return
    }

    try {
      // Use appropriate verification endpoint based on OTP type
      if (otpType === 'registration') {
        await dispatch(verifyRegistrationOTP({ email, otp: otpCode }))
      } else {
        await dispatch(verifyLoginOTP({ email, otp: otpCode }))
      }
      setOtpError('')
    } catch (error) {
      setOtpError('Invalid verification code')
    }
  }

  // Handle OTP resend
  const handleResendOTP = async () => {
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

    try {
      await dispatch(resendOTP(loginEmail))
    } catch (error) {
      console.error('Failed to resend OTP:', error)
      setOtpError('Failed to resend verification code. Please try again.')
    }
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          {otpStep ? 'Verify Your Login' : 'Sign In to NetruDoc'}
        </Typography>

        {error && !otpStep && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {otpError && otpStep && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otpError}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
          {otpStep ? (
            // OTP Verification Step
            <>
              <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                We've sent a 6-digit verification code to {loginEmail}. Please enter it below to complete your login.
              </Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Verification Code"
                name="otp"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setOtpError('')
                }}
                error={!!otpError}
                helperText={otpError}
                inputProps={{ maxLength: 6 }}
                autoFocus
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setOtpStep(false)
                    setOtpType('login') // Reset to default
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Back to Login
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
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify & Sign In'}
              </Button>
            </>
          ) : (
            // Regular Login Step
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
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                Forgot your password?
              </Link>
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default LoginPage
