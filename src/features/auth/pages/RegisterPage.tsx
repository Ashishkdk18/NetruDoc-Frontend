import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
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
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, ShieldCheck, ArrowRight, ArrowLeft, Upload, X, CheckCircle2 } from 'lucide-react'
import { RootState, AppDispatch } from '../../../store'
import { register, verifyRegistrationOTP, resendOTP, resetAuthStatus } from '../authSlice'
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
    dispatch(resetAuthStatus())
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
          <Box className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { id: 'patient', label: 'Patient', icon: <UserCheck size={20} />, desc: 'Seeking medical care' },
                { id: 'doctor', label: 'Doctor', icon: <ShieldCheck size={20} />, desc: 'Healthcare provider' }
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => formik.setFieldValue('role', role.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formik.values.role === role.id 
                      ? 'border-netru-dark bg-netru-dark/5' 
                      : 'border-netru-dark/10 hover:border-netru-dark/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg inline-block mb-3 ${formik.values.role === role.id ? 'bg-netru-dark text-netru-light' : 'bg-netru-dark/5 text-netru-dark'}`}>
                    {role.icon}
                  </div>
                  <h3 className="font-bold text-netru-dark">{role.label}</h3>
                  <p className="text-xs text-netru-dark/40">{role.desc}</p>
                </button>
              ))}
            </div>

            <TextField
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          </Box>
        )

      case 1:
        if (formik.values.role === 'doctor') {
          return (
            <Box className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <FormControl fullWidth required>
                  <InputLabel id="specialization-label">Specialization</InputLabel>
                  <Select
                    labelId="specialization-label"
                    id="specialization"
                    name="specialization"
                    value={formik.values.specialization}
                    label="Specialization"
                    onChange={formik.handleChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    {specializations.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  id="experience"
                  label="Years of Experience"
                  name="experience"
                  type="number"
                  value={formik.values.experience}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <TextField
                  fullWidth
                  id="consultationFee"
                  label="Consultation Fee (NPR)"
                  name="consultationFee"
                  type="number"
                  value={formik.values.consultationFee}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>

              <FormControl fullWidth>
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
                  sx={{ borderRadius: '12px' }}
                >
                  {hospitalsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading hospitals...
                    </MenuItem>
                  ) : Array.isArray(hospitals) && hospitals.length > 0 ? (
                    hospitals.map((hospital, index) => (
                      <MenuItem key={hospital._id || hospital.id || `h-${index}`} value={hospital.name}>
                        {hospital.name} - {hospital.address.city}, {hospital.address.state}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No hospitals available</MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="pt-4 border-t border-netru-dark/5">
                <h3 className="text-xl font-display text-netru-dark mb-2">Professional Credentials</h3>
                <p className="text-sm text-netru-dark/40 mb-6">Upload your professional documents. Max 5MB per file (PDF, JPEG, PNG).</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'license', label: 'License Document', icon: <ShieldCheck size={18} /> },
                    { id: 'degree', label: 'Degree Certificate', icon: <CheckCircle2 size={18} /> },
                    { id: 'certificate', label: 'Other Certificates', icon: <Upload size={18} /> }
                  ].map((doc) => (
                    <div key={doc.id} className="relative">
                      <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id={`${doc.id}-upload`}
                        type="file"
                        onChange={(e) => handleFileUpload(e, doc.id)}
                      />
                      <label htmlFor={`${doc.id}-upload`} className="block">
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                          credentialFiles[doc.id] 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-netru-dark/10 hover:border-netru-dark/20 bg-netru-dark/[0.02]'
                        }`}>
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <span className={credentialFiles[doc.id] ? 'text-green-600' : 'text-netru-dark/40'}>
                              {doc.icon}
                            </span>
                            <span className={`text-sm font-semibold truncate ${credentialFiles[doc.id] ? 'text-green-700' : 'text-netru-dark/60'}`}>
                              {credentialFiles[doc.id] ? credentialFiles[doc.id]?.name : doc.label}
                            </span>
                          </div>
                          {credentialFiles[doc.id] && (
                            <button 
                              onClick={(e) => { e.preventDefault(); removeFile(doc.id); }}
                              className="p-1 hover:bg-green-100 rounded-full text-green-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Box>
          )
        } else {
          return (
            <Box className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date of Birth"
                    value={formik.values.dateOfBirth}
                    onChange={(value) => formik.setFieldValue('dateOfBirth', value)}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                      },
                    }}
                  />
                </LocalizationProvider>

                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="gender"
                    name="gender"
                    value={formik.values.gender}
                    label="Gender"
                    onChange={formik.handleChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className="pt-4 border-t border-netru-dark/5">
                <h3 className="text-xl font-display text-netru-dark mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-netru-dark/30" />
                  Emergency Contact
                </h3>
                
                <div className="space-y-4">
                  <TextField
                    fullWidth
                    id="emergencyContactName"
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formik.values.emergencyContactName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      id="emergencyContactPhone"
                      label="Emergency Contact Phone"
                      name="emergencyContactPhone"
                      value={formik.values.emergencyContactPhone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />

                    <TextField
                      fullWidth
                      id="emergencyContactRelationship"
                      label="Relationship"
                      name="emergencyContactRelationship"
                      value={formik.values.emergencyContactRelationship}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </div>
                </div>
              </div>
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
    <div className="flex flex-col lg:flex-row min-h-screen font-body selection:bg-netru-dark selection:text-netru-light bg-netru-light">
      {/* Left Panel - Dark Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[40%] bg-netru-dark text-netru-light p-16 flex-col justify-between sticky top-0 h-screen overflow-hidden"
      >
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-netru-light/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        
        <div className="space-y-12 relative z-10 transition-all">
          {/* Logo */}
          <Link to="/" className="text-2xl font-display tracking-tight hover:opacity-80 transition-opacity">
            netrudoc<span className="opacity-50">.</span>
          </Link>

          <div className="space-y-6 max-w-lg">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-netru-light/20 bg-netru-light/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
                Join the Network
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-display leading-[1.1] tracking-tight">
              Start your <br /> health journey <br />
              <span className="italic">today.</span>
            </h1>

            <p className="text-netru-light/50 text-lg leading-relaxed">
              Create an account to book consultations, manage your health records, and connect with qualified professionals.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-8 pt-8">
            {[
              { icon: <UserCheck size={24} />, title: 'Personalized Care', desc: 'Tailored health plans for you' },
              { icon: <ShieldCheck size={24} />, title: 'Data Security', desc: 'Your privacy is our priority' },
            ].map((feature, idx) => (
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
                  <p className="text-netru-light/40 text-sm italic">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-12 text-xs text-netru-light/30 border-t border-netru-light/10">
          © {new Date().getFullYear()} NetruDoc. Smart Healthcare System.
        </div>
      </motion.div>

      {/* Right Panel - Multi-step Register Form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[60%] p-8 lg:p-16 flex flex-col items-center overflow-y-auto"
      >
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-12">
            <Link to="/" className="lg:hidden text-2xl font-display text-netru-dark">
              netrudoc.
            </Link>
            <div className="ml-auto flex items-center space-x-2 text-netru-dark/40 uppercase text-[10px] tracking-[0.2em] font-bold">
              <span>Step {otpStep ? 1 : activeStep + 1} of {steps.length}</span>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-display text-netru-dark mb-4">
              {otpStep ? 'One last step' : 'Join NetruDoc'}
            </h2>
            <p className="text-netru-dark/40 text-lg">
              {otpStep 
                ? 'We’ve sent a code to verify your identity.' 
                : 'Complete the steps below to set up your account.'}
            </p>
          </div>

          {!otpStep && (
            <div className="mb-12 overflow-x-auto pb-4">
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel={false}
                connector={null}
                sx={{ 
                  '& .MuiStep-root': { flex: 1, px: 1 },
                  '& .MuiStepLabel-root': { cursor: 'pointer' },
                  '& .MuiStepLabel-iconContainer': { display: 'none' },
                  '& .MuiStepLabel-label': { 
                    textAlign: 'left', 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.15em',
                    mt: '0px !important'
                  },
                  '& .MuiStepLabel-label.Mui-active': { color: '#2D2A26' },
                  '& .MuiStepLabel-label.Mui-disabled': { color: 'rgba(0,0,0,0.1)' },
                }}
              >
                {steps.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <div className="space-y-2">
                      <div className={`h-1 rounded-full transition-all duration-500 ${activeStep >= index ? 'bg-netru-dark w-full' : 'bg-netru-dark/5 w-4'}`} />
                      <StepLabel>{label}</StepLabel>
                    </div>
                  </Step>
                ))}
              </Stepper>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
              </motion.div>
            )}
            {otpError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{otpError}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Box
            component="form"
            onSubmit={(e) => e.preventDefault()}
            className="space-y-8"
          >
            <motion.div
              key={activeStep + (otpStep ? 'otp' : 'reg')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 lg:p-10 rounded-3xl border border-netru-dark/5 shadow-sm"
            >
              {getStepContent(activeStep)}
            </motion.div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6">
              {otpStep ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setOtpStep(false)} 
                    disabled={loading}
                    className="text-netru-dark/60 hover:text-netru-dark font-semibold text-sm transition-colors"
                  >
                    Back to Registration
                  </button>
                  <Button 
                    type="button" 
                    variant="contained" 
                    disabled={loading || otpCode.length !== 6} 
                    onClick={() => formik.handleSubmit()}
                    sx={{ 
                      bgcolor: '#2D2A26', borderRadius: '12px', height: '56px', px: 4,
                      '&:hover': { bgcolor: '#1a1816' }, textTransform: 'none', fontSize: '1rem', fontWeight: 600
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Complete'}
                  </Button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    disabled={activeStep === 0} 
                    onClick={handleBack}
                    className={`flex items-center space-x-2 font-semibold text-sm transition-colors ${activeStep === 0 ? 'opacity-0 pointer-events-none' : 'text-netru-dark opacity-100 hover:opacity-60'}`}
                  >
                    <ArrowLeft size={16} />
                    <span>Previous Step</span>
                  </button>

                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    {activeStep < steps.length - 1 ? (
                      <Button 
                        type="button" 
                        variant="contained" 
                        onClick={handleNext}
                        endIcon={<ArrowRight size={18} />}
                        sx={{ 
                          bgcolor: '#2D2A26', borderRadius: '12px', height: '56px', flex: 1, px: 4, minWidth: '160px',
                          '&:hover': { bgcolor: '#1a1816' }, textTransform: 'none', fontSize: '1rem', fontWeight: 600
                        }}
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        variant="contained" 
                        disabled={loading} 
                        onClick={() => formik.handleSubmit()}
                        sx={{ 
                          bgcolor: '#2D2A26', borderRadius: '12px', height: '56px', flex: 1, px: 4, minWidth: '180px',
                          '&:hover': { bgcolor: '#1a1816' }, textTransform: 'none', fontSize: '1rem', fontWeight: 600
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-8">
              <p className="text-netru-dark/40 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-netru-dark font-bold hover:underline underline-offset-4 transition-all">
                  Sign in here
                </Link>
              </p>
            </div>
          </Box>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage