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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { register, verifyRegistrationOTP, resendOTP, clearError } from '../authSlice'
import { PatientRegistrationData, DoctorRegistrationData, Specialization } from '../models/authModels'
import { hospitalApi } from '../../hospitals/api'
import { Hospital } from '../../hospitals/models/hospitalModels'
import dayjs, { Dayjs } from 'dayjs'

const specializations: Specialization[] = [
  'general-medicine',
  'cardiology',
  'dermatology',
  'neurology',
  'orthopedics',
  'pediatrics',
  'psychiatry',
  'radiology',
  'surgery',
  'urology',
  'gynecology',
  'ophthalmology'
]

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [activeStep, setActiveStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalsLoading, setHospitalsLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [credentialFiles, setCredentialFiles] = useState<{[key: string]: File | null}>({
    license: null,
    degree: null,
    certificate: null,
    other: null
  })

  const { loading, error, isAuthenticated, otpRequired } = useSelector((state: RootState) => state.auth)

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Helper function to convert empty strings to undefined
  const cleanValue = (value: any): any => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    return value;
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, JPEG, JPG, and PNG files are allowed')
        return
      }
      setCredentialFiles(prev => ({ ...prev, [type]: file }))
    }
  }

  // Remove file
  const removeFile = (type: string) => {
    setCredentialFiles(prev => ({ ...prev, [type]: null }))
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to allow navbar to update with new auth state
      const timer = setTimeout(() => {
        navigate('/dashboard')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, navigate])

  // Handle successful registration (switch to OTP step) - moved after formik declaration

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  // Patient validation schema
  const patientValidationSchema = Yup.object({
    name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
    phone: Yup.string().optional(),
    dateOfBirth: Yup.date().max(new Date(), 'Date of birth cannot be in the future').optional(),
    gender: Yup.string().oneOf(['male', 'female', 'other']).optional(),
    emergencyContactName: Yup.string().when('emergencyContactPhone', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Emergency contact name is required'),
      otherwise: (schema) => schema.optional()
    }),
    emergencyContactPhone: Yup.string().optional(),
    emergencyContactRelationship: Yup.string().when('emergencyContactPhone', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Relationship is required'),
      otherwise: (schema) => schema.optional()
    }),
  })

  // Doctor validation schema
  const doctorValidationSchema = Yup.object({
    name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
    phone: Yup.string().optional(),
    licenseNumber: Yup.string().required('License number is required for doctors'),
    specialization: Yup.string().required('Specialization is required'),
    experience: Yup.number().min(0, 'Experience must be positive').optional(),
    hospital: Yup.string().optional(),
    consultationFee: Yup.number().min(0, 'Consultation fee must be positive').optional(),
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient' as 'patient' | 'doctor',
      phone: '',
      // Patient fields
      dateOfBirth: null as Dayjs | null,
      gender: '' as 'male' | 'female' | 'other' | '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      // Doctor fields
      licenseNumber: '',
      specialization: '' as Specialization | '',
      qualifications: [] as string[],
      experience: 0,
      hospital: '',
      consultationFee: 0,
      // Address
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nepal',
    },
    validate: (values) => {
      try {
        const schema = values.role === 'doctor' ? doctorValidationSchema : patientValidationSchema;
        schema.validateSync(values, { abortEarly: false });
        return {};
      } catch (error: any) {
        const errors: Record<string, string> = {};
        error.inner?.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        return errors;
      }
    },
    onSubmit: async (values) => {
      // Only allow submission in OTP step or on the final registration step
      if (otpStep) {
        // Handle OTP verification
        await handleOTPVerification(values.email)
      } else if (!otpStep && activeStep === steps.length - 1) {
        // Only handle registration on the final step (Address)
        await handleInitialRegistration(values)
      } else {
        // Prevent submission on intermediate steps - do nothing
        return
      }
    },
  })

  // Handle successful registration (switch to OTP step)
  useEffect(() => {
    if (otpRequired && !otpStep) {
      // Registration was successful and OTP is required, switch to OTP verification step
      setOtpStep(true)
      setActiveStep(0) // Reset stepper for OTP step
    }
  }, [otpRequired, otpStep])

  // Handle initial registration (send OTP)
  const handleInitialRegistration = async (values: typeof formik.values) => {
    const { confirmPassword, dateOfBirth, ...submitData } = values

    // Build address object only with defined, non-empty values
    const address: any = {};
    if (submitData.street?.trim()) address.street = submitData.street.trim();
    if (submitData.city?.trim()) address.city = submitData.city.trim();
    if (submitData.state?.trim()) address.state = submitData.state.trim();
    if (submitData.zipCode?.trim()) address.zipCode = submitData.zipCode.trim();
    address.country = submitData.country || 'Nepal';

    // Check if address has meaningful data (more than just country)
    const hasAddressData = address.street || address.city || address.state || address.zipCode;

    // Prepare qualification documents for doctors
    let qualificationDocuments: any[] = []
    if (submitData.role === 'doctor') {
      for (const [type, file] of Object.entries(credentialFiles)) {
        if (file) {
          try {
            const base64 = await fileToBase64(file)
            qualificationDocuments.push({
              name: file.name,
              url: base64,
              type: type,
              uploadedAt: new Date().toISOString()
            })
          } catch (error) {
            console.error('Error converting file to base64:', error)
          }
        }
      }
    }

    if (submitData.role === 'patient') {
      if (loading) return; // Prevent duplicate submissions during loading
      const patientData: PatientRegistrationData = {
        name: submitData.name,
        email: submitData.email,
        password: submitData.password,
        role: 'patient',
        phone: cleanValue(submitData.phone),
        address: hasAddressData ? address : undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
        gender: cleanValue(submitData.gender),
        emergencyContact: submitData.emergencyContactName && submitData.emergencyContactPhone
          ? {
            name: submitData.emergencyContactName.trim(),
            phone: submitData.emergencyContactPhone.trim(),
            relationship: submitData.emergencyContactRelationship?.trim() || '',
          }
          : undefined,
      }
      await dispatch(register(patientData))
    } else {
      if (loading) return; // Prevent duplicate submissions during loading
      const doctorData: DoctorRegistrationData = {
        name: submitData.name,
        email: submitData.email,
        password: submitData.password,
        role: 'doctor',
        phone: cleanValue(submitData.phone),
        address: hasAddressData ? address : undefined,
        licenseNumber: submitData.licenseNumber,
        specialization: submitData.specialization as Specialization,
        qualifications: submitData.qualifications.length > 0 ? submitData.qualifications : undefined,
        experience: submitData.experience || undefined,
        hospital: submitData.hospital || undefined,
        consultationFee: submitData.consultationFee || undefined,
        qualificationDocuments: qualificationDocuments.length > 0 ? qualificationDocuments : undefined,
      }
      await dispatch(register(doctorData))
    }
  }

  // Handle OTP verification
  const handleOTPVerification = async (email: string) => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the verification code')
      return
    }

    try {
      const result = await dispatch(verifyRegistrationOTP({ email, otp: otpCode }))
      if (verifyRegistrationOTP.fulfilled.match(result)) {
        setOtpError('')
      } else {
        setOtpError(result.payload as string || 'Invalid verification code')
      }
    } catch (error: any) {
      setOtpError(error.message || 'Invalid verification code')
    }
  }

  // Fetch hospitals when component mounts or role changes to doctor
  useEffect(() => {
    const fetchHospitals = async () => {
      if (formik.values.role === 'doctor') {
        setHospitalsLoading(true)
        try {
          const response = await hospitalApi.getHospitals({}, { limit: 100 })
          if (response && response.status === 'success' && response.data && response.data.items && Array.isArray(response.data.items)) {
            setHospitals(response.data.items)
          } else {
            setHospitals([])
          }
        } catch (error) {
          console.error('Failed to fetch hospitals:', error)
          setHospitals([])
        } finally {
          setHospitalsLoading(false)
        }
      } else {
        // Clear hospitals when role is not doctor
        setHospitals([])
      }
    }

    fetchHospitals()
  }, [formik.values.role])

  const handleRoleChange = (event: SelectChangeEvent) => {
    const role = event.target.value as 'patient' | 'doctor'
    formik.setFieldValue('role', role)
    // Validation schema will be updated automatically via useMemo
    formik.setFieldTouched('role', false)
  }

  const steps = otpStep
    ? ['Email Verification']
    : ['Basic Information', formik.values.role === 'doctor' ? 'Professional Details' : 'Medical Information', 'Address']


    const getStepContent = (step: number) => {
   
      if (otpStep) {
        // Show OTP verification UI
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              We've sent a 6-digit verification code to your email address. Please enter it below to complete your registration.
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
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="text"
                onClick={handleResendOTP}
                disabled={resendDisabled}
                sx={{ textTransform: 'none' }}
              >
                {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        )
      }
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">I am a</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formik.values.role}
                label="I am a"
                onChange={handleRoleChange}
                error={formik.touched.role && Boolean(formik.errors.role)}
              >
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )

      case 1:
        if (formik.values.role === 'doctor') {
          return (
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="licenseNumber"
                label="License Number"
                name="licenseNumber"
                value={formik.values.licenseNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.licenseNumber && Boolean(formik.errors.licenseNumber)}
                helperText={formik.touched.licenseNumber && formik.errors.licenseNumber}
              />

              <FormControl fullWidth margin="normal" required>
                <InputLabel id="specialization-label">Specialization</InputLabel>
                <Select
                  labelId="specialization-label"
                  id="specialization"
                  name="specialization"
                  value={formik.values.specialization}
                  label="Specialization"
                  onChange={formik.handleChange}
                  error={formik.touched.specialization && Boolean(formik.errors.specialization)}
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                id="experience"
                label="Years of Experience"
                name="experience"
                type="number"
                value={formik.values.experience}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.experience && Boolean(formik.errors.experience)}
                helperText={formik.touched.experience && formik.errors.experience}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel id="hospital-label">Hospital/Clinic Name</InputLabel>
                <Select
                  labelId="hospital-label"
                  id="hospital"
                  name="hospital"
                  value={formik.values.hospital}
                  label="Hospital/Clinic Name"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={hospitalsLoading}
                >
                  {hospitalsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading hospitals...
                    </MenuItem>
                  ) : Array.isArray(hospitals) && hospitals.length > 0 ? (
                    hospitals.map((hospital) => (
                      <MenuItem key={hospital.id} value={hospital.name}>
                        {hospital.name} - {hospital.address.city}, {hospital.address.state}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No hospitals available</MenuItem>
                  )}
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                id="consultationFee"
                label="Consultation Fee (NPR)"
                name="consultationFee"
                type="number"
                value={formik.values.consultationFee}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.consultationFee && Boolean(formik.errors.consultationFee)}
                helperText={formik.touched.consultationFee && formik.errors.consultationFee}
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Professional Credentials (Optional)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Upload your professional documents. Maximum 5MB per file. Supported formats: PDF, JPEG, PNG.
              </Typography>

              {/* License Document */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="license-upload"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'license')}
                />
                <label htmlFor="license-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<span>📄</span>}
                    sx={{ justifyContent: 'flex-start', mb: 1 }}
                  >
                    Upload License Document
                  </Button>
                </label>
                {credentialFiles.license && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {credentialFiles.license.name}
                    </Typography>
                    <Button size="small" color="error" onClick={() => removeFile('license')}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Degree Certificate */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="degree-upload"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'degree')}
                />
                <label htmlFor="degree-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<span>🎓</span>}
                    sx={{ justifyContent: 'flex-start', mb: 1 }}
                  >
                    Upload Degree Certificate
                  </Button>
                </label>
                {credentialFiles.degree && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {credentialFiles.degree.name}
                    </Typography>
                    <Button size="small" color="error" onClick={() => removeFile('degree')}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Other Certificates */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="certificate-upload"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'certificate')}
                />
                <label htmlFor="certificate-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<span>🏆</span>}
                    sx={{ justifyContent: 'flex-start', mb: 1 }}
                  >
                    Upload Other Certificates
                  </Button>
                </label>
                {credentialFiles.certificate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {credentialFiles.certificate.name}
                    </Typography>
                    <Button size="small" color="error" onClick={() => removeFile('certificate')}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )
        } else {
          return (
            <Box>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date of Birth"
                  value={formik.values.dateOfBirth}
                  onChange={(value) => formik.setFieldValue('dateOfBirth', value)}
                  maxDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                    },
                  }}
                />
              </LocalizationProvider>

              <FormControl fullWidth margin="normal">
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  name="gender"
                  value={formik.values.gender}
                  label="Gender"
                  onChange={formik.handleChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Emergency Contact (Optional)
              </Typography>

              <TextField
                margin="normal"
                fullWidth
                id="emergencyContactName"
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={formik.values.emergencyContactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactName && Boolean(formik.errors.emergencyContactName)}
                helperText={formik.touched.emergencyContactName && formik.errors.emergencyContactName}
              />

              <TextField
                margin="normal"
                fullWidth
                id="emergencyContactPhone"
                label="Emergency Contact Phone"
                name="emergencyContactPhone"
                value={formik.values.emergencyContactPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactPhone && Boolean(formik.errors.emergencyContactPhone)}
                helperText={formik.touched.emergencyContactPhone && formik.errors.emergencyContactPhone}
              />

              <TextField
                margin="normal"
                fullWidth
                id="emergencyContactRelationship"
                label="Relationship"
                name="emergencyContactRelationship"
                value={formik.values.emergencyContactRelationship}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactRelationship && Boolean(formik.errors.emergencyContactRelationship)}
                helperText={formik.touched.emergencyContactRelationship && formik.errors.emergencyContactRelationship}
              />
            </Box>
          )
        }

      case 2:
        return (
          <Box>
            <TextField
              margin="normal"
              fullWidth
              id="street"
              label="Street Address"
              name="street"
              value={formik.values.street}
              onChange={formik.handleChange}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="city"
                  label="City"
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="state"
                  label="State/Province"
                  name="state"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="zipCode"
                  label="Zip Code"
                  name="zipCode"
                  value={formik.values.zipCode}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="country"
                  label="Country"
                  name="country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  disabled
                />
              </Grid>
            </Grid>
          </Box>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              We've sent a 6-digit verification code to your email address. Please enter it below to complete your registration.
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
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="text"
                onClick={handleResendOTP}
                disabled={resendDisabled}
                sx={{ textTransform: 'none' }}
              >
                {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        )

      default:
        return null
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
      await dispatch(resendOTP(formik.values.email))
    } catch (error) {
      console.error('Failed to resend OTP:', error)
      setOtpError('Failed to resend verification code. Please try again.')
    }
  }

  // Helper function to get fields for each step
  const getStepFields = (step: number): string[] => {
    if (step === 0) return ['name', 'email', 'password', 'confirmPassword', 'role'];
    if (step === 1) {
      return formik.values.role === 'doctor'
        ? ['licenseNumber', 'specialization']
        : ['dateOfBirth', 'gender']; // Optional fields, but validate if filled
    }
    if (step === 2) return ['street', 'city', 'zipCode']; // Address fields
    return [];
  };

  const handleNext = () => {
    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);
    currentStepFields.forEach((field) => formik.setFieldTouched(field, true));

    // Check if current step is valid
    const stepErrors = currentStepFields.filter(
      field => formik.errors[field as keyof typeof formik.errors]
    );

    if (stepErrors.length === 0) {
      setActiveStep(activeStep + 1);
    }
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Join NetruDoc
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Create your account to access healthcare services
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={otpStep ? 0 : activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault(); // Prevent any accidental form submissions
          }}
        >
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            {otpStep ? (
              <>
                <Button type="button" onClick={() => setOtpStep(false)} disabled={loading}>
                  Back to Registration
                </Button>
                <Button type="button" variant="contained" disabled={loading || otpCode.length !== 6} onClick={() => {
                  formik.handleSubmit();
                }}>
                  {loading ? <CircularProgress size={24} /> : 'Verify & Complete'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button type="button" variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" variant="contained" disabled={loading} onClick={() => {
                    if (activeStep === steps.length - 1) {
                      formik.handleSubmit();
                    }
                  }}>
                    {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
                  </Button>
                )}
              </>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
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

export default RegisterPage