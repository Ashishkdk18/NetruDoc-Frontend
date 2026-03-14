import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  IconButton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
} from '@mui/icons-material'
import { AppDispatch, RootState } from '../../../store/index'
import {
  getConsultationById,
  updateNotes,
  updateDiagnosis,
  updateSymptoms,
  clearError,
} from '../consultationSlice'
import CreatePrescriptionForm from '../../prescriptions/components/CreatePrescriptionForm'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const ConsultationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { currentConsultation, loading, error, updatingNotes } = useSelector(
    (state: RootState) => state.consultations
  )
  const { user } = useSelector((state: RootState) => state.auth)

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState<string[]>([])
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false)
  const [newDiagnosis, setNewDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [isEditingSymptoms, setIsEditingSymptoms] = useState(false)
  const [newSymptom, setNewSymptom] = useState('')
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)

  const isDoctor = user?.role === 'doctor'
  const consultation = currentConsultation

  useEffect(() => {
    if (id) {
      dispatch(getConsultationById(id))
    }
    return () => {
      dispatch(clearError())
    }
  }, [id, dispatch])

  useEffect(() => {
    if (consultation) {
      setNotes(consultation.notes || '')
      setDiagnosis(consultation.diagnosis || [])
      setSymptoms(consultation.symptoms || [])
    }
  }, [consultation])

  const handleSaveNotes = async () => {
    if (!id) return
    try {
      await dispatch(updateNotes({ consultationId: id, notes })).unwrap()
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const handleCancelNotes = () => {
    setNotes(consultation?.notes || '')
    setIsEditingNotes(false)
  }

  const handleAddDiagnosis = () => {
    if (newDiagnosis.trim() && !diagnosis.includes(newDiagnosis.trim())) {
      const updated = [...diagnosis, newDiagnosis.trim()]
      setDiagnosis(updated)
      setNewDiagnosis('')
      if (id) {
        dispatch(updateDiagnosis({ consultationId: id, diagnosis: updated }))
      }
    }
  }

  const handleRemoveDiagnosis = (item: string) => {
    const updated = diagnosis.filter((d) => d !== item)
    setDiagnosis(updated)
    if (id) {
      dispatch(updateDiagnosis({ consultationId: id, diagnosis: updated }))
    }
  }

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      const updated = [...symptoms, newSymptom.trim()]
      setSymptoms(updated)
      setNewSymptom('')
      if (id) {
        dispatch(updateSymptoms({ consultationId: id, symptoms: updated }))
      }
    }
  }

  const handleRemoveSymptom = (item: string) => {
    const updated = symptoms.filter((s) => s !== item)
    setSymptoms(updated)
    if (id) {
      dispatch(updateSymptoms({ consultationId: id, symptoms: updated }))
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

  if (!consultation) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Consultation not found</Alert>
      </Container>
    )
  }

  const patient = typeof consultation.patientId === 'object' ? consultation.patientId : null
  const doctor = typeof consultation.doctorId === 'object' ? consultation.doctorId : null
  const appointment = typeof consultation.appointmentId === 'object' ? consultation.appointmentId : null

  const appointmentId = appointment?._id || appointment?.id || consultation.appointmentId

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Consultation Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Consultation Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consultation Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1">
                    {patient?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1">
                    {doctor?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {consultation.startTime
                      ? dayjs(consultation.startTime).format('MMMM D, YYYY h:mm A')
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    End Time
                  </Typography>
                  <Typography variant="body1">
                    {consultation.endTime
                      ? dayjs(consultation.endTime).format('MMMM D, YYYY h:mm A')
                      : 'Ongoing'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={consultation.status}
                    color={
                      consultation.status === 'completed'
                        ? 'success'
                        : consultation.status === 'active'
                        ? 'primary'
                        : 'default'
                    }
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                {appointmentId && (
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" spacing={2}>
                      <Link to={`/appointments/${appointmentId}`}>
                        <Button variant="outlined" size="small">
                          View Related Appointment
                        </Button>
                      </Link>
                      {isDoctor && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<MedicationIcon />}
                          onClick={() => setPrescriptionDialogOpen(true)}
                        >
                          Create Prescription
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Consultation Notes</Typography>
                {isDoctor && !isEditingNotes && (
                  <IconButton onClick={() => setIsEditingNotes(true)} size="small">
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {isEditingNotes && isDoctor ? (
                <Box>
                  <TextField
                    multiline
                    rows={10}
                    maxRows={20}
                    fullWidth
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={updatingNotes}
                    inputProps={{ maxLength: 2000 }}
                    helperText={`${notes.length}/2000 characters`}
                    sx={{ mb: 2 }}
                  />
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveNotes}
                      disabled={updatingNotes}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelNotes}
                      disabled={updatingNotes}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {notes || 'No notes available'}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Diagnosis Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Diagnosis</Typography>
                {isDoctor && (
                  <IconButton
                    onClick={() => setIsEditingDiagnosis(!isEditingDiagnosis)}
                    size="small"
                  >
                    {isEditingDiagnosis ? <CancelIcon /> : <EditIcon />}
                  </IconButton>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {isEditingDiagnosis && isDoctor ? (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Enter diagnosis"
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDiagnosis()
                        }
                      }}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddDiagnosis}
                      disabled={!newDiagnosis.trim()}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {diagnosis.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        onDelete={() => handleRemoveDiagnosis(item)}
                        deleteIcon={<DeleteIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {diagnosis.length > 0 ? (
                    diagnosis.map((item) => <Chip key={item} label={item} />)
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No diagnosis recorded
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Symptoms Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Symptoms</Typography>
                {isDoctor && (
                  <IconButton
                    onClick={() => setIsEditingSymptoms(!isEditingSymptoms)}
                    size="small"
                  >
                    {isEditingSymptoms ? <CancelIcon /> : <EditIcon />}
                  </IconButton>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {isEditingSymptoms && isDoctor ? (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Enter symptom"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSymptom()
                        }
                      }}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSymptom}
                      disabled={!newSymptom.trim()}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {symptoms.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        onDelete={() => handleRemoveSymptom(item)}
                        deleteIcon={<DeleteIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {symptoms.length > 0 ? (
                    symptoms.map((item) => <Chip key={item} label={item} />)
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No symptoms recorded
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Prescription Dialog */}
      {isDoctor && consultation && (
        <CreatePrescriptionForm
          open={prescriptionDialogOpen}
          onClose={() => setPrescriptionDialogOpen(false)}
          patientId={
            typeof consultation.patientId === 'object'
              ? consultation.patientId?._id || consultation.patientId?.id
              : consultation.patientId
          }
          appointmentId={appointmentId || undefined}
          consultationId={id || undefined}
          onSuccess={() => {
            setPrescriptionDialogOpen(false)
          }}
        />
      )}
    </Container>
  )
}

export default ConsultationDetailsPage
