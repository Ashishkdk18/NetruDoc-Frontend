import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Medication as MedicationIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material'
import { AppDispatch, RootState } from '../../../store/index'
import { getPrescriptionById, downloadPrescription, clearError } from '../prescriptionSlice'
import { Prescription } from '../api/prescriptionApi'
import dayjs from 'dayjs'

const PrescriptionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { currentPrescription, loading, error, downloading } = useSelector(
    (state: RootState) => state.prescriptions
  )

  useEffect(() => {
    if (id) {
      dispatch(getPrescriptionById(id))
    }
    return () => {
      dispatch(clearError())
    }
  }, [id, dispatch])

  const handleDownload = async () => {
    if (!id) return
    try {
      await dispatch(downloadPrescription(id)).unwrap()
    } catch (error) {
      console.error('Failed to download prescription:', error)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!currentPrescription) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Prescription not found</Alert>
      </Container>
    )
  }

  const prescription: Prescription = currentPrescription
  const patient = typeof prescription.patientId === 'object' ? prescription.patientId : null
  const doctor = typeof prescription.doctorId === 'object' ? prescription.doctorId : null
  const appointment = typeof prescription.appointmentId === 'object' ? prescription.appointmentId : null

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Prescription Details
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Prescription Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prescription Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1">{patient?.name || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1">
                    {doctor?.name ? `Dr. ${doctor.name}` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={prescription.isActive ? 'Active' : 'Inactive'}
                    color={prescription.isActive ? 'success' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {prescription.createdAt
                      ? dayjs(prescription.createdAt).format('MMMM D, YYYY h:mm A')
                      : 'N/A'}
                  </Typography>
                </Grid>
                {prescription.followUpDate && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Follow-up Date
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(prescription.followUpDate).format('MMMM D, YYYY')}
                    </Typography>
                  </Grid>
                )}
                {appointment && (
                  <Grid size={{ xs: 12 }}>
                    <Link to={`/appointments/${appointment._id || appointment.id || prescription.appointmentId}`}>
                      <Button variant="outlined" size="small">
                        View Related Appointment
                      </Button>
                    </Link>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Medications Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MedicationIcon />
                <Typography variant="h6">Medications</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {prescription.medications && prescription.medications.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Medication</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Duration</TableCell>
                        {prescription.medications.some((m) => m.instructions) && (
                          <TableCell>Instructions</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prescription.medications.map((medication, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {medication.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{medication.dosage}</TableCell>
                          <TableCell>{medication.frequency}</TableCell>
                          <TableCell>{medication.duration}</TableCell>
                          {prescription.medications.some((m) => m.instructions) && (
                            <TableCell>{medication.instructions || '—'}</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No medications prescribed
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Diagnoses Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HospitalIcon />
                <Typography variant="h6">Diagnoses</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {prescription.diagnoses && prescription.diagnoses.length > 0 ? (
                <Stack spacing={2}>
                  {prescription.diagnoses.map((diagnosis, index) => {
                    const diag =
                      typeof diagnosis === 'object'
                        ? diagnosis
                        : { condition: diagnosis, icdCode: '', notes: '' }
                    return (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {diag.condition}
                            </Typography>
                            {diag.icdCode && (
                              <Chip label={`ICD: ${diag.icdCode}`} size="small" variant="outlined" />
                            )}
                          </Box>
                          {diag.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {diag.notes}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No diagnoses recorded
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          {prescription.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {prescription.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/prescriptions')}
                >
                  Back to Prescriptions
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default PrescriptionDetailsPage
