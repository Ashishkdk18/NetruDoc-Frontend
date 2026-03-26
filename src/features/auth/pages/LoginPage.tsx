import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { Visibility, VisibilityOff, ArrowForward } from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, Calendar, ShieldCheck } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)

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
        await handleOTPVerification(values.email)
      } else {
        await handleInitialLogin(values)
      }
    },
  })

  useEffect(() => {
    if (otpRequired && !otpStep) {
      setOtpStep(true)
      setOtpType('registration')
    }
  }, [otpRequired, otpStep])

  const handleInitialLogin = async (values: typeof formik.values) => {
    try {
      setLoginEmail(values.email)
      await dispatch(login(values)).unwrap()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const handleOTPVerification = async (email: string) => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the verification code')
      return
    }

    try {
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

  const features = [
    {
      icon: <UserCheck size={24} className="text-netru-light opacity-80" />,
      title: 'Verified Specialists',
      description: 'Board-certified doctors only',
    },
    {
      icon: <Calendar size={24} className="text-netru-light opacity-80" />,
      title: 'Easy Appointments',
      description: 'Book in under 60 seconds',
    },
    {
      icon: <ShieldCheck size={24} className="text-netru-light opacity-80" />,
      title: 'Private & Secure',
      description: 'Your data stays yours',
    },
  ]

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-body selection:bg-netru-dark selection:text-netru-light">
      {/* Left Panel - Dark Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[45%] bg-netru-dark text-netru-light p-8 lg:p-16 flex flex-col justify-between"
      >
        <div className="space-y-12">
          {/* Logo */}
          <Link to="/" className="text-2xl font-display tracking-tight hover:opacity-80 transition-opacity">
            netrudoc<span className="opacity-50">.</span>
          </Link>

          <div className="space-y-6 max-w-lg">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-netru-light/20 bg-netru-light/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
                Trusted Healthcare Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-display leading-[1.1] tracking-tight">
              Care that <br /> comes to <br />
              <span className="italic">you.</span>
            </h1>

            <p className="text-netru-light/60 text-lg leading-relaxed">
              Connect with verified doctors, book appointments, and manage your health — all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-8 pt-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={feature.title} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-start space-x-4 group"
              >
                <div className="p-3 rounded-xl border border-netru-light/10 bg-netru-light/5 group-hover:bg-netru-light/10 transition-colors">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-netru-light/50 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info for desktop */}
        <div className="hidden lg:block pt-12 text-xs text-netru-light/30">
          © {new Date().getFullYear()} NetruDoc. All rights reserved.
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[55%] bg-netru-light p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-netru-cream rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-netru-cream rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

        {/* Top Navbar Simulation */}
        <div className="absolute top-8 lg:top-12 left-8 right-8 lg:left-16 lg:right-16 flex justify-between items-center z-10">
          <div className="lg:hidden">
            <Link to="/" className="text-xl font-display text-netru-dark">netrudoc.</Link>
          </div>
          <div className="ml-auto">
            <button className="flex items-center space-x-2 text-netru-dark/60 hover:text-netru-dark transition-colors uppercase text-[10px] tracking-[0.2em] font-bold">
              
            </button>
          </div>
        </div>

        <div className="w-full max-w-md relative z-10 py-12 lg:py-0">
          <div className="mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-netru-dark/30 mb-2 block">
              Welcome back
            </span>
            <h2 className="text-4xl lg:text-5xl font-display text-netru-dark mb-4">
              Sign in to NetruDoc
            </h2>
            <div className="w-12 h-[2px] bg-netru-dark/10" />
          </div>

          <AnimatePresence mode="wait">
            {error && !otpStep && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
              </motion.div>
            )}
            {otpError && otpStep && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{otpError}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Box component="form" onSubmit={formik.handleSubmit} className="space-y-6">
            {otpStep ? (
              <div className="space-y-6">
                <p className="text-netru-dark/60 text-sm leading-relaxed">
                  We've sent a 6-digit verification code to <span className="text-netru-dark font-semibold">{loginEmail}</span>.
                </p>

                <TextField
                  fullWidth
                  id="otp"
                  label="Verification Code"
                  variant="outlined"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setOtpError('')
                  }}
                  error={!!otpError}
                  helperText={otpError}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'white',
                    }
                  }}
                />

                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="text-netru-dark/60 hover:text-netru-dark transition-colors underline underline-offset-4"
                  >
                    Back to login
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendDisabled}
                    className={`font-semibold ${resendDisabled ? 'text-netru-dark/20' : 'text-netru-dark hover:opacity-70'}`}
                  >
                    {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </button>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading || otpCode.length !== 6}
                  className="bg-netru-dark text-netru-light h-14 rounded-xl normal-case text-lg font-semibold hover:bg-netru-dark/90 transition-all shadow-lg shadow-netru-dark/10"
                  variant="contained"
                  sx={{ 
                    bgcolor: '#2D2A26', 
                    '&:hover': { bgcolor: '#1a1816' },
                    borderRadius: '12px',
                    height: '56px',
                    textTransform: 'none',
                    fontSize: '1.125rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Sign In'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-netru-dark/50 ml-1">Email Address</label>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                        '&:hover fieldset': { borderColor: '#2D2A26' },
                        '&.Mui-focused fieldset': { borderColor: '#2D2A26' },
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-netru-dark/50 ml-1">Password</label>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                        '&:hover fieldset': { borderColor: '#2D2A26' },
                        '&.Mui-focused fieldset': { borderColor: '#2D2A26' },
                      }
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <FormControlLabel
                    control={<Checkbox size="small" sx={{ color: '#2D2A26', '&.Mui-checked': { color: '#2D2A26' } }} />}
                    label={<span className="text-sm text-netru-dark/60">Remember me</span>}
                  />
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-netru-dark/60 hover:text-netru-dark transition-colors font-medium underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  endIcon={!loading && <ArrowForward />}
                  className="bg-netru-dark text-netru-light h-14 rounded-xl normal-case text-lg font-semibold hover:bg-netru-dark/90 transition-all shadow-lg shadow-netru-dark/10"
                  variant="contained"
                  sx={{ 
                    bgcolor: '#2D2A26', 
                    '&:hover': { bgcolor: '#1a1816' },
                    borderRadius: '12px',
                    height: '56px',
                    textTransform: 'none',
                    fontSize: '1.125rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </div>
            )}
          </Box>

          <div className="mt-12 text-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-netru-dark/10" />
            </div>
            <span className="relative z-10 bg-netru-light px-4 text-xs font-bold uppercase tracking-widest text-netru-dark/20">
              or
            </span>
          </div>

          <div className="mt-8 text-center">
            <p className="text-netru-dark/60 text-sm">
              No account yet?{' '}
              <Link to="/register" className="text-netru-dark font-bold hover:opacity-70 transition-all underline underline-offset-4">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden mt-12 py-8 w-full border-t border-netru-dark/5 flex flex-col items-center space-y-4">
            <div className="flex space-x-6 text-xs text-netru-dark/40 font-medium">
             
            </div>
            <span className="text-[10px] text-netru-dark/30">
              © {new Date().getFullYear()} NetruDoc. All rights reserved.
            </span>
        </div>

        {/* Desktop Footer links */}
        <div className="hidden lg:flex absolute bottom-8 left-16 right-16 justify-between items-center text-xs text-netru-dark/40 font-medium z-10">
          <div className="flex space-x-8">
            <button className="hover:text-netru-dark transition-colors">Privacy</button>
            <button className="hover:text-netru-dark transition-colors">Terms</button>
            <button className="hover:text-netru-dark transition-colors">Support</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
