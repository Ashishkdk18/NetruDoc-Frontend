import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material'
import {
  Save as SaveIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { AppDispatch } from '../../../store'
import { userApi } from '../api/userApi'
import { clearError } from '../../auth/authSlice'

interface AvailabilityData {
  monday: { start: string; end: string; available: boolean }
  tuesday: { start: string; end: string; available: boolean }
  wednesday: { start: string; end: string; available: boolean }
  thursday: { start: string; end: string; available: boolean }
  friday: { start: string; end: string; available: boolean }
  saturday: { start: string; end: string; available: boolean }
  sunday: { start: string; end: string; available: boolean }
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

const validationSchema = Yup.object().shape(
  daysOfWeek.reduce((schema, day) => ({
    ...schema,
    [day.key]: Yup.object().shape({
      available: Yup.boolean(),
      start: Yup.string().when('available', {
        is: true,
        then: (schema) => schema.required(`${day.label} start time is required when available`)
                         .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, `${day.label} start time must be in HH:MM format`),
        otherwise: (schema) => schema.optional()
      }),
      end: Yup.string().when('available', {
        is: true,
        then: (schema) => schema.required(`${day.label} end time is required when available`)
                         .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, `${day.label} end time must be in HH:MM format`)
                         .test('end-after-start', `${day.label} end time must be after start time`, function(value) {
                           const { start } = this.parent
                           if (!start || !value) return true
                           const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1])
                           const endMinutes = parseInt(value.split(':')[0]) * 60 + parseInt(value.split(':')[1])
                           return endMinutes > startMinutes
                         }),
        otherwise: (schema) => schema.optional()
      })
    })
  }), {} as any)
)

const DoctorAvailabilityPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formik = useFormik<AvailabilityData>({
    initialValues: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: false },
      sunday: { start: '09:00', end: '13:00', available: false }
    },
    validationSchema,
    onSubmit: async (values) => {
      await handleSave(values)
    }
  })

  // Load current availability on component mount
  useEffect(() => {
    loadAvailability()
  }, [])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getDoctorAvailability()
      if (response.status === 'success') {
        const availability = response.data.availability || {}
        formik.setValues({
          monday: availability.monday || { start: '09:00', end: '17:00', available: true },
          tuesday: availability.tuesday || { start: '09:00', end: '17:00', available: true },
          wednesday: availability.wednesday || { start: '09:00', end: '17:00', available: true },
          thursday: availability.thursday || { start: '09:00', end: '17:00', available: true },
          friday: availability.friday || { start: '09:00', end: '17:00', available: true },
          saturday: availability.saturday || { start: '09:00', end: '13:00', available: false },
          sunday: availability.sunday || { start: '09:00', end: '13:00', available: false }
        })
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: AvailabilityData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await userApi.updateDoctorAvailability(values)
      if (response.status === 'success') {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  const handleAvailabilityToggle = (dayKey: string, checked: boolean) => {
    formik.setFieldValue(`${dayKey}.available`, checked)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Availability
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set your weekly schedule to let patients know when you're available for appointments.
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Availability updated successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TimeIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Weekly Schedule
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadAvailability}
                sx={{ ml: 'auto' }}
                size="small"
              >
                Reset
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Configure your working hours for each day of the week. Patients will only be able to book appointments during your available times.
            </Typography>

            <Grid container spacing={3}>
              {daysOfWeek.map((day) => (
                <Grid size={{ xs: 12 }} key={day.key}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {day.label}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values[day.key as keyof AvailabilityData].available}
                            onChange={(e) => handleAvailabilityToggle(day.key, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={formik.values[day.key as keyof AvailabilityData].available ? 'Available' : 'Unavailable'}
                      />
                    </Box>

                    {formik.values[day.key as keyof AvailabilityData].available && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Start Time"
                            type="time"
                            name={`${day.key}.start`}
                            value={formik.values[day.key as keyof AvailabilityData].start}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={(formik.touched as any)[day.key]?.start && Boolean((formik.errors as any)[day.key]?.start)}
                            helperText={(formik.touched as any)[day.key]?.start && (formik.errors as any)[day.key]?.start}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 900 }} // 15 minute steps
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="End Time"
                            type="time"
                            name={`${day.key}.end`}
                            value={formik.values[day.key as keyof AvailabilityData].end}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={(formik.touched as any)[day.key]?.end && Boolean((formik.errors as any)[day.key]?.end)}
                            helperText={(formik.touched as any)[day.key]?.end && (formik.errors as any)[day.key]?.end}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 900 }} // 15 minute steps
                          />
                        </Grid>
                      </Grid>
                    )}

                    {!formik.values[day.key as keyof AvailabilityData].available && (
                      <Typography variant="body2" color="text.secondary">
                        You are not available on {day.label.toLowerCase()}s.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/appointments/doctor/schedule')}
              >
                View Schedule
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Availability'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Container>
  )
}

export default DoctorAvailabilityPage