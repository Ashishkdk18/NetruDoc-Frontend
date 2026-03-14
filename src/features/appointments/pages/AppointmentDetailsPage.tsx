import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Stack,
  TextField,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Info as InfoIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Chat as ChatIcon,
  Videocam as VideocamIcon,
  Notes as NotesIcon,
  Visibility as VisibilityIcon,
  Medication as MedicationIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'

import { RootState, AppDispatch } from '../../../store'
import { getAppointmentById, handleRescheduleRequest } from '../appointmentSlice'
import consultationApi, { Consultation } from '../../consultations/api/consultationApi'
import { getPrescriptions, downloadPrescription } from '../../prescriptions/prescriptionSlice'
import { Prescription } from '../../prescriptions/api/prescriptionApi'
import { reportsApi, MedicalReport } from '../../reports/api/reportsApi'

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'error',
} as const

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const

const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { currentAppointment, loading, error, updating } = useSelector((state: RootState) => state.appointments)
  const { user } = useSelector((state: RootState) => state.auth)
  const { loading: loadingPrescriptions, downloading } = useSelector((state: RootState) => state.prescriptions)

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [rescheduleAction, setRescheduleAction] = useState<'approve' | 'reject' | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [consultationStatus, setConsultationStatus] = useState<
    'idle' | 'loading' | 'active' | 'inactive' | 'error'
  >('idle')
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<Prescription[]>([])
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportUploading, setReportUploading] = useState(false)
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportDescription, setReportDescription] = useState('')

  const appointment: any = currentAppointment
  const appointmentId = appointment?.id || appointment?._id || id

  useEffect(() => {
    if (!id) return
    dispatch(getAppointmentById(id))
  }, [dispatch, id])

  // Load prescriptions for this appointment
  useEffect(() => {
    if (!id) return
    const loadPrescriptions = async () => {
      try {
        const result = await dispatch(getPrescriptions({ appointmentId: String(id), limit: 100 })).unwrap()
        setAppointmentPrescriptions(result.items || [])
      } catch (error) {
        console.error('Failed to load prescriptions:', error)
        setAppointmentPrescriptions([])
      }
    }
    loadPrescriptions()
  }, [id, dispatch])

  // Load medical reports for this appointment
  const loadReports = React.useCallback(async () => {
    if (!id) return
    setReportsLoading(true)
    try {
      const res = await reportsApi.getByAppointmentId(id) as any
      const items = res?.data?.items ?? res?.items ?? []
      setReports(Array.isArray(items) ? items : [])
    } catch (e) {
      console.error('Failed to load reports', e)
      setReports([])
    } finally {
      setReportsLoading(false)
    }
  }, [id])
  useEffect(() => {
    loadReports()
  }, [loadReports])

  const patient =
    appointment && typeof appointment.patientId === 'object' ? appointment.patientId : null
  const doctor =
    appointment && typeof appointment.doctorId === 'object' ? appointment.doctorId : null

  // Format address object to string
  const formatAddress = (address: any): string => {
    if (!address) return ''
    if (typeof address === 'string') return address
    if (typeof address === 'object') {
      const parts = []
      if (address.street) parts.push(address.street)
      if (address.city) parts.push(address.city)
      if (address.state) parts.push(address.state)
      if (address.zipCode) parts.push(address.zipCode)
      if (address.country) parts.push(address.country)
      return parts.join(', ')
    }
    return ''
  }

  // Check if current user is the doctor for this appointment
  const isDoctor = user?.role === 'doctor'
  const doctorId = doctor?._id || doctor?.id
  const userId = user?.id || (user as any)?._id || (user as any)?.userId || user?.id || ''
  const isAssignedDoctor = doctorId && userId && doctorId.toString() === userId.toString()
  const canHandleReschedule = isDoctor && isAssignedDoctor && appointment?.rescheduleStatus === 'pending'

  const handleRescheduleAction = (action: 'approve' | 'reject') => {
    setRescheduleAction(action)
    setRescheduleDialogOpen(true)
  }

  const handleOpenChat = () => {
    if (!doctorId || !appointmentId) return
    const searchParams = new URLSearchParams()
    searchParams.set('doctorId', String(doctorId))
    searchParams.set('appointmentId', String(appointmentId))
    navigate(`/chat?${searchParams.toString()}`)
  }

  const isConfirmed = appointment?.status === 'confirmed'

  useEffect(() => {
    if (!appointmentId) return
    let cancelled = false

    ;(async () => {
      try {
        setConsultationStatus('loading')
        const { consultation: consultationData } = await consultationApi.getByAppointmentId(String(appointmentId))
        if (cancelled) return
        setConsultation(consultationData)
        setConsultationStatus(consultationData?.status === 'active' ? 'active' : consultationData ? 'inactive' : 'idle')
      } catch (e) {
        if (cancelled) return
        setConsultationStatus('error')
        setConsultation(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [appointmentId])

  const handleStartOrJoinConsultation = async () => {
    if (!appointmentId) return

    // First, check if there's already an active consultation
    try {
      const { consultation } = await consultationApi.getByAppointmentId(String(appointmentId))
      if (consultation && consultation.status === 'active') {
        // Consultation already active, redirect to it
        navigate(`/consultation/${appointmentId}`)
        return
      }
    } catch (e) {
      // If we can't check, continue with the normal flow
      console.warn('Could not check consultation status:', e)
    }

    // Doctor starts via REST, then both parties join the appointment-based room on /consultation/:appointmentId.
    if (isDoctor && isAssignedDoctor) {
      try {
        await consultationApi.startConsultation(String(appointmentId))
        navigate(`/consultation/${appointmentId}`)
      } catch (e: any) {
        // If consultation is already active, redirect to it
        if (e?.message?.includes('already active')) {
          navigate(`/consultation/${appointmentId}`)
          return
        }
        setSnackbarMessage(e?.message || 'Failed to start consultation')
        setSnackbarOpen(true)
      }
      return
    }

    // Patient can join only when consultation is active
    if (consultationStatus === 'active') {
      navigate(`/consultation/${appointmentId}`)
      return
    }

    setSnackbarMessage('Consultation has not started yet. Please wait for the doctor.')
    setSnackbarOpen(true)
  }

  const confirmRescheduleAction = async () => {
    if (!id || !rescheduleAction) return

    try {
      await dispatch(handleRescheduleRequest({
        appointmentId: id,
        action: rescheduleAction
      })).unwrap()

      setSnackbarMessage(`Reschedule ${rescheduleAction === 'approve' ? 'approved' : 'rejected'} successfully`)
      setSnackbarOpen(true)
      setRescheduleDialogOpen(false)
      setRescheduleAction(null)
      
      // Refresh appointment data
      dispatch(getAppointmentById(id))
    } catch (error: any) {
      setSnackbarMessage(error || `Failed to ${rescheduleAction} reschedule request`)
      setSnackbarOpen(true)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined">
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1">
              Appointment Details
            </Typography>
            {appointmentId && (
              <Typography variant="body2" color="text.secondary">
                ID: {appointmentId}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {appointment?.status && (
            <Chip
              label={statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status}
              color={statusColors[appointment.status as keyof typeof statusColors] || 'default'}
            />
          )}
          {appointmentId && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Both participants must be on the consultation page for the video call to connect.
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<VideocamIcon />}
                onClick={handleStartOrJoinConsultation}
                disabled={
                  !isConfirmed ||
                  (isDoctor && !isAssignedDoctor) ||
                  (!isDoctor && consultationStatus !== 'active')
                }
              >
                {isDoctor ? 'Start Video Call' : 'Join Video Call'}
              </Button>
            </>
          )}
          {doctorId && userId && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<ChatIcon />}
              onClick={handleOpenChat}
            >
              Open Chat
            </Button>
          )}
        </Stack>
      </Box>

      {!id && (
        <Alert severity="error">
          Missing appointment id in the URL.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : !appointment ? (
        <Alert severity="info">
          Appointment not found.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Overview
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="body2">
                        {appointment.date ? new Date(appointment.date).toLocaleDateString() : '—'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" />
                      <Typography variant="body2">{appointment.time || '—'}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                      Reason
                    </Typography>
                    <Typography variant="body2">{appointment.reason || '—'}</Typography>
                  </Grid>
                  {appointment.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                        Notes
                      </Typography>
                      <Typography variant="body2">{appointment.notes}</Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Reschedule
                  </Typography>
                  {appointment.rescheduleStatus && (
                    <Chip
                      label={appointment.rescheduleStatus.charAt(0).toUpperCase() + appointment.rescheduleStatus.slice(1)}
                      color={
                        appointment.rescheduleStatus === 'approved' ? 'success' :
                        appointment.rescheduleStatus === 'rejected' ? 'error' :
                        appointment.rescheduleStatus === 'pending' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  )}
                </Box>
                
                {appointment.rescheduleStatus === 'pending' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Patient has requested to reschedule this appointment
                  </Alert>
                )}

                {(appointment.rescheduleStatus === 'pending' ||
                  appointment.rescheduleStatus === 'approved' ||
                  appointment.rescheduleStatus === 'rejected') && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Requested Date:</strong> {appointment.rescheduleNewDate ? new Date(appointment.rescheduleNewDate).toLocaleDateString() : '—'}{' '}
                      {appointment.rescheduleNewTime ? `at ${appointment.rescheduleNewTime}` : ''}
                    </Typography>
                    {appointment.rescheduleReason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Reason:</strong> {appointment.rescheduleReason}
                      </Typography>
                    )}
                    {appointment.rescheduleRequestedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Requested on: {new Date(appointment.rescheduleRequestedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}

                {canHandleReschedule && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleRescheduleAction('approve')}
                      disabled={updating}
                    >
                      Approve Reschedule
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleRescheduleAction('reject')}
                      disabled={updating}
                    >
                      Reject Reschedule
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {appointment.preConsultationForm && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Pre-consultation Form
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Symptoms
                      </Typography>
                      <Typography variant="body2">
                        {Array.isArray(appointment.preConsultationForm.symptoms)
                          ? appointment.preConsultationForm.symptoms.join(', ') || '—'
                          : '—'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Medications
                      </Typography>
                      <Typography variant="body2">
                        {Array.isArray(appointment.preConsultationForm.currentMedications)
                          ? appointment.preConsultationForm.currentMedications.join(', ') || '—'
                          : '—'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Allergies
                      </Typography>
                      <Typography variant="body2">
                        {Array.isArray(appointment.preConsultationForm.allergies)
                          ? appointment.preConsultationForm.allergies.join(', ') || '—'
                          : '—'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Medical History
                      </Typography>
                      <Typography variant="body2">
                        {appointment.preConsultationForm.medicalHistory || '—'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Notes
                      </Typography>
                      <Typography variant="body2">
                        {appointment.preConsultationForm.additionalNotes || '—'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Consultation Notes Section */}
            {consultation && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotesIcon sx={{ mr: 1 }} />
                      Consultation Notes
                    </Typography>
                    <Chip
                      label={consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                      color={
                        consultation.status === 'completed'
                          ? 'success'
                          : consultation.status === 'active'
                          ? 'primary'
                          : 'default'
                      }
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Consultation Date/Time */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {consultation.startTime && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Start Time
                        </Typography>
                        <Typography variant="body2">
                          {dayjs(consultation.startTime).format('MMMM D, YYYY h:mm A')}
                        </Typography>
                      </Grid>
                    )}
                    {consultation.endTime && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          End Time
                        </Typography>
                        <Typography variant="body2">
                          {dayjs(consultation.endTime).format('MMMM D, YYYY h:mm A')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Consultation Notes */}
                  {consultation.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {consultation.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Diagnosis */}
                  {consultation.diagnosis && consultation.diagnosis.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Diagnosis
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {consultation.diagnosis.map((item, index) => (
                          <Chip key={index} label={item} size="small" color="primary" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Symptoms */}
                  {consultation.symptoms && consultation.symptoms.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Symptoms
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {consultation.symptoms.map((item, index) => (
                          <Chip key={index} label={item} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Link to full consultation details */}
                  {consultation._id || consultation.id ? (
                    <Box sx={{ mt: 2 }}>
                      <Link to={`/consultations/${consultation._id || consultation.id}`}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                        >
                          View Full Consultation Details
                        </Button>
                      </Link>
                    </Box>
                  ) : null}

                  {!consultation.notes && 
                   (!consultation.diagnosis || consultation.diagnosis.length === 0) && 
                   (!consultation.symptoms || consultation.symptoms.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No consultation notes available yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Prescriptions Section */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <MedicationIcon sx={{ mr: 1 }} />
                    Prescriptions
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {loadingPrescriptions ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : appointmentPrescriptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No prescriptions available for this appointment.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {appointmentPrescriptions.map((prescription) => {
                      const prescriptionId = prescription._id || prescription.id
                      const doctor = typeof prescription.doctorId === 'object' ? prescription.doctorId : null
                      
                      return (
                        <Box
                          key={prescriptionId}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                Prescription
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {prescription.createdAt
                                  ? dayjs(prescription.createdAt).format('MMMM D, YYYY')
                                  : '—'}
                                {doctor && ` • Dr. ${doctor.name}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={prescription.isActive ? 'Active' : 'Inactive'}
                              color={prescription.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>

                          {/* Medications Summary */}
                          {prescription.medications && prescription.medications.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Medications ({prescription.medications.length}):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {prescription.medications.slice(0, 3).map((med, idx) => (
                                  <Chip
                                    key={idx}
                                    label={med.name}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {prescription.medications.length > 3 && (
                                  <Chip
                                    label={`+${prescription.medications.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Diagnoses Summary */}
                          {prescription.diagnoses && prescription.diagnoses.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Diagnoses:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {prescription.diagnoses.slice(0, 2).map((diag, idx) => {
                                  const condition = typeof diag === 'object' ? diag.condition : diag
                                  return (
                                    <Chip
                                      key={idx}
                                      label={condition}
                                      size="small"
                                      color="primary"
                                    />
                                  )
                                })}
                                {prescription.diagnoses.length > 2 && (
                                  <Chip
                                    label={`+${prescription.diagnoses.length - 2} more`}
                                    size="small"
                                    color="primary"
                                  />
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              component={Link}
                              to={`/prescriptions/${prescriptionId}`}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={async () => {
                                if (prescriptionId) {
                                  try {
                                    await dispatch(downloadPrescription(prescriptionId)).unwrap()
                                  } catch (error) {
                                    console.error('Failed to download prescription:', error)
                                  }
                                }
                              }}
                              disabled={downloading}
                            >
                              Download PDF
                            </Button>
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Medical Reports Section */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachFileIcon sx={{ mr: 1 }} />
                    Medical Reports
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Upload form */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Upload report (PDF or image, max 10MB)
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                      Choose file
                      <input
                        type="file"
                        hidden
                        accept=".pdf,image/*"
                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      />
                    </Button>
                    {reportFile && (
                      <Typography variant="body2" color="text.secondary">
                        {reportFile.name}
                      </Typography>
                    )}
                    <TextField
                      size="small"
                      label="Description (optional)"
                      value={reportDescription}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportDescription(e.target.value)}
                      sx={{ minWidth: 200 }}
                    />
                    <Button
                      variant="contained"
                      disabled={!reportFile || reportUploading}
                      onClick={async () => {
                        if (!id || !reportFile) return
                        setReportUploading(true)
                        try {
                          await reportsApi.upload(id, reportFile, reportDescription || undefined)
                          setReportFile(null)
                          setReportDescription('')
                          loadReports()
                          setSnackbarMessage('Report uploaded successfully')
                          setSnackbarOpen(true)
                        } catch (e: any) {
                          setSnackbarMessage(e?.message || 'Upload failed')
                          setSnackbarOpen(true)
                        } finally {
                          setReportUploading(false)
                        }
                      }}
                    >
                      {reportUploading ? 'Uploading…' : 'Upload'}
                    </Button>
                  </Stack>
                </Box>

                {reportsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : reports.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No medical reports for this appointment.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {reports.map((r) => (
                      <Box
                        key={r._id}
                        sx={{
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {r.originalName}
                          </Typography>
                          {r.description && (
                            <Typography variant="caption" color="text.secondary">
                              {r.description}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {(r.size / 1024).toFixed(1)} KB
                            {r.uploadedBy && ` • ${r.uploadedBy.name}`}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => reportsApi.download(r._id, r.originalName)}
                        >
                          Download
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Patient
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {patient?.name || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {patient?.email || ''}
                </Typography>
                {patient?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {patient.phone}
                  </Typography>
                )}
                {patient?.address && (
                  <Typography variant="body2" color="text.secondary">
                    {formatAddress(patient.address)}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <DoctorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Doctor
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {doctor?.name ? `Dr. ${doctor.name}` : '—'}
                </Typography>
                {doctor?.specialization && (
                  <Typography variant="body2" color="text.secondary">
                    {String(doctor.specialization).replace('-', ' ').toUpperCase()}
                  </Typography>
                )}
                {doctor?.hospital && (
                  <Typography variant="body2" color="text.secondary">
                    {typeof doctor.hospital === 'object' ? (doctor.hospital as any)?.name : doctor.hospital}
                  </Typography>
                )}
                {doctor?.consultationFee != null && (
                  <Typography variant="body2" color="text.secondary">
                    Fee: {doctor.consultationFee}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={rescheduleDialogOpen}
        onClose={() => {
          setRescheduleDialogOpen(false)
          setRescheduleAction(null)
        }}
      >
        <DialogTitle>
          {rescheduleAction === 'approve' ? 'Approve Reschedule Request' : 'Reject Reschedule Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {rescheduleAction === 'approve' 
              ? 'Are you sure you want to approve this reschedule request? The appointment date and time will be updated.'
              : 'Are you sure you want to reject this reschedule request? The patient will be notified.'}
          </DialogContentText>
          {appointment && rescheduleAction === 'approve' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current:</strong> {appointment.date ? new Date(appointment.date).toLocaleDateString() : '—'} at {appointment.time || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>New:</strong> {appointment.rescheduleNewDate ? new Date(appointment.rescheduleNewDate).toLocaleDateString() : '—'} at {appointment.rescheduleNewTime || '—'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRescheduleDialogOpen(false)
              setRescheduleAction(null)
            }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRescheduleAction}
            color={rescheduleAction === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Processing...' : rescheduleAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AppointmentDetailsPage

