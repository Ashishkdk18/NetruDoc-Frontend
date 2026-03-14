import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField
} from '@mui/material'
import {
  LocalHospital as HospitalIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { RootState, AppDispatch } from '../../../store'
import {
  getAvailableSlots,
  createAppointment,
  clearError,
  clearAvailableSlots
} from '../appointmentSlice'
import { userApi } from '../../users/api/userApi'
import { User } from '../../auth/models/authModels'
import PreConsultationForm, { PreConsultationFormData } from '../components/PreConsultationForm'

const steps = ['Select Date & Time', 'Fill Pre-Consultation Form', 'Confirm Booking']

const validationSchema = Yup.object({
  date: Yup.date()
    .required('Date is required')
    .min(new Date(), 'Cannot book appointments in the past'),
  time: Yup.string()
    .required('Time is required'),
  reason: Yup.string()
    .required('Appointment reason is required')
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
  notes: Yup.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
})

const AppointmentBookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [doctor, setDoctor] = useState<User | null>(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  const {
    availableSlots,
    loadingSlots,
    slotsError,
    creating,
    error
  } = useSelector((state: RootState) => state.appointments)

  const formik = useFormik({
    initialValues: {
      date: null as Dayjs | null,
      time: '',
      reason: '',
      notes: '',
      preConsultationForm: {
        symptoms: [] as string[],
        currentMedications: [] as string[],
        allergies: [] as string[],
        medicalHistory: '',
        additionalNotes: ''
      } as PreConsultationFormData
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!doctorId || !values.date || !values.time) return

      try {
        const appointmentData = {
          doctorId,
          date: values.date.format('YYYY-MM-DD'),
          time: values.time,
          reason: values.reason,
          notes: values.notes,
          preConsultationForm: values.preConsultationForm
        }

        console.log('Creating appointment with data:', appointmentData)

        const createdAppointment = await dispatch(createAppointment(appointmentData)).unwrap()

        // If there is a consultation fee, navigate to payment page
        if (doctor && doctor.consultationFee && doctor.consultationFee > 0) {
          navigate('/payment', {
            state: {
              appointmentId: createdAppointment.id,
              doctorId: doctor.id,
              doctorName: doctor.name,
              amount: doctor.consultationFee,
              date: createdAppointment.date,
              time: createdAppointment.time
            }
          })
        } else {
          // Navigate to success page or appointment details
          navigate('/appointments/my', {
            state: { message: 'Appointment booked successfully!' }
          })
        }
      } catch (error) {
        console.error('Failed to create appointment:', error)
      }
    }
  })

  // Load doctor information
  useEffect(() => {
    const loadDoctor = async () => {
      if (!doctorId) return

      try {
        setLoadingDoctor(true)
        const response = await userApi.getUserById(doctorId)
        if (response.status === 'success') {
          setDoctor(response.data.user)
        }
      } catch (error) {
        console.error('Failed to load doctor:', error)
      } finally {
        setLoadingDoctor(false)
      }
    }

    loadDoctor()
  }, [doctorId])

  // Load available slots when date changes
  useEffect(() => {
    if (formik.values.date) {
      dispatch(getAvailableSlots({
        doctorId: doctorId!,
        date: formik.values.date.format('YYYY-MM-DD')
      }))
    } else {
      dispatch(clearAvailableSlots())
    }
  }, [formik.values.date, doctorId, dispatch])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError())
      dispatch(clearAvailableSlots())
    }
  }, [dispatch])

  const handleDateChange = (newDate: Dayjs | null) => {
    formik.setFieldValue('date', newDate)
    formik.setFieldValue('time', '')
    setSelectedTimeSlot('')
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
    formik.setFieldValue('time', timeSlot)
  }

  const handleNext = () => {
    if (activeStep === 0 && (!formik.values.date || !formik.values.time)) {
      return
    }
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handlePreConsultationSubmit = (preConsultationData: PreConsultationFormData) => {
    formik.setFieldValue('preConsultationForm', preConsultationData)
    setActiveStep(2)
  }

  if (loadingDoctor) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!doctor) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Doctor not found. Please go back and select a different doctor.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule a consultation with Dr. {doctor.name}
        </Typography>
      </Box>

      {/* Doctor Information Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                src={doctor.profilePicture}
              >
                {doctor.name.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid size="grow">
              <Typography variant="h5" component="h2" gutterBottom>
                Dr. {doctor.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {doctor.specialization && `${doctor.specialization.replace('-', ' ').toUpperCase()} • `}
                {doctor.experience && `${doctor.experience} years experience`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                {doctor.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="body2">
                      {doctor.rating.toFixed(1)} ({doctor.totalReviews} reviews)
                    </Typography>
                  </Box>
                )}
                {doctor.consultationFee && (
                  <Chip
                    label={`Rs. ${doctor.consultationFee}`}
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>
            </Grid>
            <Grid>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  <HospitalIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  {typeof doctor.hospital === 'object' ? (doctor.hospital as any)?.name : doctor.hospital || 'Hospital not specified'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stepper and Content */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

        {/* Error Display */}
        {(error || slotsError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || slotsError}
          </Alert>
        )}

        {/* Step 1: Date & Time Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Date & Time
            </Typography>

            <Grid container spacing={4}>
              {/* Date Picker */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Choose Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={formik.values.date}
                    onChange={handleDateChange}
                    minDate={dayjs()}
                    maxDate={dayjs().add(90, 'day')} // Allow booking up to 90 days in advance
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.date && Boolean(formik.errors.date),
                        helperText: formik.touched.date && formik.errors.date
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Time Slots */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Available Time Slots
                </Typography>

                {loadingSlots ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : availableSlots.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1 }}>
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTimeSlot === slot ? 'contained' : 'outlined'}
                        onClick={() => handleTimeSlotSelect(slot)}
                        sx={{
                          minHeight: 40,
                          fontSize: '0.875rem'
                        }}
                      >
                        {slot}
                      </Button>
                    ))}
                  </Box>
                ) : formik.values.date ? (
                  <Alert severity="info">
                    No available slots for the selected date. Please choose a different date.
                  </Alert>
                ) : (
                  <Alert severity="info">
                    Please select a date to view available time slots.
                  </Alert>
                )}

                {formik.touched.time && formik.errors.time && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formik.errors.time}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Appointment Reason *"
                placeholder="Please describe the reason for your appointment (at least 10 characters)..."
                value={formik.values.reason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="reason"
                error={formik.touched.reason && Boolean(formik.errors.reason)}
                helperText={
                  formik.touched.reason && formik.errors.reason
                    ? formik.errors.reason
                    : formik.touched.reason
                      ? `${formik.values.reason.length}/500 (min 10 characters)`
                      : 'Min 10 characters required'
                }
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Notes (Optional)"
                placeholder="Any additional information you'd like to share..."
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="notes"
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
              />
            </Box>
          </Box>
        )}

        {/* Step 2: Pre-Consultation Form */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pre-Consultation Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Please provide the following information to help your doctor prepare for the consultation.
            </Typography>

            <PreConsultationForm
              initialValues={formik.values.preConsultationForm}
              onSubmit={handlePreConsultationSubmit}
              submitButtonText="Continue to Confirmation"
            />
          </Box>
        )}

        {/* Step 3: Confirmation */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Appointment
            </Typography>

            {/* Show validation errors on step 2 when Confirm Booking was clicked but validation failed */}
            {formik.submitCount > 0 && Object.keys(formik.errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Please fix the following before booking:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                  {Object.entries(formik.errors).map(([field, msg]) => (
                    <li key={field}>
                      {field === 'date' && 'Date: '}
                      {field === 'time' && 'Time: '}
                      {field === 'reason' && 'Reason: '}
                      {field === 'notes' && 'Notes: '}
                      {typeof msg === 'string' ? msg : String(msg)}
                    </li>
                  ))}
                </ul>
                Use Back to correct the details.
              </Alert>
            )}

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Appointment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Doctor</Typography>
                    <Typography variant="body1">Dr. {doctor.name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Specialization</Typography>
                    <Typography variant="body1">
                      {doctor.specialization?.replace('-', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">
                      {formik.values.date?.format('dddd, MMMM D, YYYY')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Time</Typography>
                    <Typography variant="body1">{formik.values.time}</Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">Reason</Typography>
                    <Typography variant="body1">{formik.values.reason}</Typography>
                  </Grid>
                  {formik.values.notes && (
                    <Grid size={12}>
                      <Typography variant="body2" color="text.secondary">Additional Notes</Typography>
                      <Typography variant="body1">{formik.values.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                By booking this appointment, you agree to provide accurate pre-consultation information.
                Your appointment will be confirmed once reviewed by the doctor.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>

          <Box>
            {activeStep === 0 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  !formik.values.date ||
                  !formik.values.time ||
                  !formik.values.reason?.trim() ||
                  formik.values.reason.trim().length < 10
                }
              >
                Continue to Pre-Consultation Form
              </Button>
            )}

            {activeStep === 2 && (
              <Button
                variant="contained"
                onClick={formik.submitForm}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} /> : null}
              >
                {creating ? 'Booking...' : 'Confirm Booking'}
              </Button>
            )}
          </Box>
        </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default AppointmentBookingPage
