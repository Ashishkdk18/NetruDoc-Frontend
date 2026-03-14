import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { updateProfile, loadUser, changePassword } from '../../auth/authSlice'
import { ProfileUpdate, Specialization } from '../../auth/models/authModels'
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

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user, loading, error } = useSelector((state: RootState) => state.auth)
  const [tabValue, setTabValue] = useState(0)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      dispatch(loadUser())
    }
  }, [user, dispatch])

  const profileFormik = useFormik<any>({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || 'Nepal',
      },
      ...(user?.role === 'patient' && {
        dateOfBirth: user?.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user?.gender || '',
        emergencyContact: user?.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
        },
      }),
      ...(user?.role === 'doctor' && {
        specialization: user?.specialization || '',
        licenseNumber: user?.licenseNumber || '',
        qualifications: user?.qualifications || [],
        experience: user?.experience || 0,
        hospital: user?.hospital || '',
        consultationFee: user?.consultationFee || 0,
      }),
    } as ProfileUpdate,
    validationSchema: Yup.object({
      name: Yup.string().min(2, 'Name must be at least 2 characters'),
      email: Yup.string().email('Invalid email address'),
      phone: Yup.string().optional(),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      const updateData: any = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
      }

      if (user?.role === 'patient') {
        updateData.dateOfBirth = values.dateOfBirth instanceof dayjs ? values.dateOfBirth.toISOString() : values.dateOfBirth
        updateData.gender = values.gender
        updateData.emergencyContact = values.emergencyContact
      }

      if (user?.role === 'doctor') {
        updateData.specialization = values.specialization
        updateData.licenseNumber = values.licenseNumber
        updateData.qualifications = values.qualifications
        updateData.experience = values.experience
        updateData.hospital = values.hospital
        updateData.consultationFee = values.consultationFee
      }

      await dispatch(updateProfile(updateData))
      navigate('/profile')
    },
  })

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values) => {
      setPasswordError(null)
      const result = await dispatch(changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }))

      if (changePassword.rejected.match(result)) {
        setPasswordError(result.payload as string)
      } else {
        passwordFormik.resetForm()
        setPasswordError(null)
      }
    },
  })

  if (loading && !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Profile
        </Typography>

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Profile Information" />
          <Tab label="Change Password" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 && (
          <Box component="form" onSubmit={profileFormik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={profileFormik.values.name}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                  helperText={profileFormik.touched.name && (profileFormik.errors.name as string)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={profileFormik.values.email}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                  helperText={profileFormik.touched.email && (profileFormik.errors.email as string)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  value={profileFormik.values.phone}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                />
              </Grid>

              {/* Patient-specific fields */}
              {user.role === 'patient' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Date of Birth"
                        value={profileFormik.values.dateOfBirth as Dayjs | null}
                        onChange={(value) => profileFormik.setFieldValue('dateOfBirth', value)}
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select
                        labelId="gender-label"
                        id="gender"
                        name="gender"
                        value={profileFormik.values.gender || ''}
                        label="Gender"
                        onChange={profileFormik.handleChange}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      Emergency Contact
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      id="emergencyContactName"
                      label="Name"
                      value={profileFormik.values.emergencyContact?.name || ''}
                      onChange={(e) =>
                        profileFormik.setFieldValue('emergencyContact', {
                          ...profileFormik.values.emergencyContact,
                          name: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      id="emergencyContactPhone"
                      label="Phone"
                      value={profileFormik.values.emergencyContact?.phone || ''}
                      onChange={(e) =>
                        profileFormik.setFieldValue('emergencyContact', {
                          ...profileFormik.values.emergencyContact,
                          phone: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      id="emergencyContactRelationship"
                      label="Relationship"
                      value={profileFormik.values.emergencyContact?.relationship || ''}
                      onChange={(e) =>
                        profileFormik.setFieldValue('emergencyContact', {
                          ...profileFormik.values.emergencyContact,
                          relationship: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </>
              )}

              {/* Doctor-specific fields */}
              {user.role === 'doctor' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      id="licenseNumber"
                      label="License Number"
                      name="licenseNumber"
                      value={profileFormik.values.licenseNumber || ''}
                      onChange={profileFormik.handleChange}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="specialization-label">Specialization</InputLabel>
                      <Select
                        labelId="specialization-label"
                        id="specialization"
                        name="specialization"
                        value={profileFormik.values.specialization || ''}
                        label="Specialization"
                        onChange={profileFormik.handleChange}
                      >
                        {specializations.map((spec) => (
                          <MenuItem key={spec} value={spec}>
                            {spec.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      id="experience"
                      label="Years of Experience"
                      name="experience"
                      type="number"
                      value={profileFormik.values.experience || 0}
                      onChange={profileFormik.handleChange}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      id="consultationFee"
                      label="Consultation Fee (NPR)"
                      name="consultationFee"
                      type="number"
                      value={profileFormik.values.consultationFee || 0}
                      onChange={profileFormik.handleChange}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      id="hospital"
                      label="Hospital/Clinic Name"
                      name="hospital"
                      value={profileFormik.values.hospital || ''}
                      onChange={profileFormik.handleChange}
                    />
                  </Grid>
                </>
              )}

              {/* Address fields */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Address
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="street"
                  label="Street Address"
                  name="address.street"
                  value={profileFormik.values.address?.street || ''}
                  onChange={profileFormik.handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="city"
                  label="City"
                  name="address.city"
                  value={profileFormik.values.address?.city || ''}
                  onChange={profileFormik.handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="state"
                  label="State/Province"
                  name="address.state"
                  value={profileFormik.values.address?.state || ''}
                  onChange={profileFormik.handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="zipCode"
                  label="Zip Code"
                  name="address.zipCode"
                  value={profileFormik.values.address?.zipCode || ''}
                  onChange={profileFormik.handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="country"
                  label="Country"
                  name="address.country"
                  value={profileFormik.values.address?.country || 'Nepal'}
                  onChange={profileFormik.handleChange}
                  disabled
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => navigate('/profile')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box component="form" onSubmit={passwordFormik.handleSubmit}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <TextField
              fullWidth
              margin="normal"
              name="currentPassword"
              label="Current Password"
              type="password"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
            />

            <TextField
              fullWidth
              margin="normal"
              name="newPassword"
              label="New Password"
              type="password"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
            />

            <TextField
              fullWidth
              margin="normal"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => navigate('/profile')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default EditProfilePage
