import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  IconButton,
  Typography,
  Divider,
  Stack,
  Alert,
  Autocomplete,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'
import { AppDispatch, RootState } from '../../../store/index'
import { createPrescription, clearError } from '../prescriptionSlice'
import { Medication, Diagnosis } from '../api/prescriptionApi'
import userApi from '../../users/api/userApi'

interface PatientOption {
  _id: string
  name: string
  email: string
  phone?: string
}

interface CreatePrescriptionFormProps {
  open: boolean
  onClose: () => void
  patientId?: string
  appointmentId?: string
  consultationId?: string
  onSuccess?: () => void
}

const CreatePrescriptionForm: React.FC<CreatePrescriptionFormProps> = ({
  open,
  onClose,
  patientId: initialPatientId,
  appointmentId,
  consultationId,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { creating, error } = useSelector((state: RootState) => state.prescriptions)

  const [patientId, setPatientId] = useState(initialPatientId || '')
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
  const [patientSearchLoading, setPatientSearchLoading] = useState(false)
  const [patientInputValue, setPatientInputValue] = useState('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([{ condition: '', icdCode: '', notes: '' }])
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState<Dayjs | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch patients when search input changes (debounced)
  const fetchPatients = useCallback(async (search: string) => {
    try {
      setPatientSearchLoading(true)
      const response = await userApi.getPatients({ search, limit: 10 })
      const patients = (response as any)?.data?.items || (response as any)?.data || []
      setPatientOptions(
        patients.map((p: any) => ({
          _id: p._id,
          name: p.name,
          email: p.email,
          phone: p.phone,
        }))
      )
    } catch (err) {
      console.error('Failed to fetch patients:', err)
      setPatientOptions([])
    } finally {
      setPatientSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialPatientId && patientInputValue.length >= 1) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        fetchPatients(patientInputValue)
      }, 300)
    } else if (patientInputValue.length === 0) {
      // Load initial list when field is focused but empty
      fetchPatients('')
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [patientInputValue, initialPatientId, fetchPatients])

  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  const handleRemoveMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const handleAddDiagnosis = () => {
    setDiagnoses([...diagnoses, { condition: '', icdCode: '', notes: '' }])
  }

  const handleRemoveDiagnosis = (index: number) => {
    if (diagnoses.length > 1) {
      setDiagnoses(diagnoses.filter((_, i) => i !== index))
    }
  }

  const handleDiagnosisChange = (index: number, field: keyof Diagnosis, value: string) => {
    const updated = [...diagnoses]
    updated[index] = { ...updated[index], [field]: value }
    setDiagnoses(updated)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!patientId) {
      errors.patientId = 'Patient is required'
    }

    medications.forEach((med, index) => {
      if (!med.name.trim()) {
        errors[`medication_${index}_name`] = 'Medication name is required'
      }
      if (!med.dosage.trim()) {
        errors[`medication_${index}_dosage`] = 'Dosage is required'
      }
      if (!med.frequency.trim()) {
        errors[`medication_${index}_frequency`] = 'Frequency is required'
      }
      if (!med.duration.trim()) {
        errors[`medication_${index}_duration`] = 'Duration is required'
      }
    })

    diagnoses.forEach((diag, index) => {
      if (!diag.condition.trim()) {
        errors[`diagnosis_${index}_condition`] = 'Diagnosis condition is required'
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const prescriptionData = {
        patientId,
        appointmentId,
        consultationId,
        medications: medications.filter((m) => m.name.trim() !== ''),
        diagnoses: diagnoses.filter((d) => d.condition.trim() !== ''),
        notes: notes.trim() || undefined,
        followUpDate: followUpDate ? followUpDate.toISOString() : undefined,
      }

      await dispatch(createPrescription(prescriptionData)).unwrap()
      handleClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create prescription:', error)
    }
  }

  const handleClose = () => {
    setPatientId(initialPatientId || '')
    setSelectedPatient(null)
    setPatientOptions([])
    setPatientInputValue('')
    setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    setDiagnoses([{ condition: '', icdCode: '', notes: '' }])
    setNotes('')
    setFollowUpDate(null)
    setFormErrors({})
    dispatch(clearError())
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create Prescription</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Patient Selection */}
          {!initialPatientId && (
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={selectedPatient}
              onChange={(_event, newValue) => {
                setSelectedPatient(newValue)
                setPatientId(newValue?._id || '')
                if (newValue) {
                  setFormErrors((prev) => {
                    const { patientId: _, ...rest } = prev
                    return rest
                  })
                }
              }}
              inputValue={patientInputValue}
              onInputChange={(_event, newInputValue) => {
                setPatientInputValue(newInputValue)
              }}
              loading={patientSearchLoading}
              filterOptions={(x) => x}
              noOptionsText={patientInputValue ? 'No patients found' : 'Start typing to search...'}
              renderOption={(props, option) => (
                <li {...props} key={option._id}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}{option.phone ? ` • ${option.phone}` : ''}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Patient"
                  placeholder="Type patient name, email, or phone..."
                  required
                  error={!!formErrors.patientId}
                  helperText={formErrors.patientId}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {patientSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}

          {/* Medications Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Medications</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddMedication} size="small">
                Add Medication
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {medications.map((medication, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Medication {index + 1}</Typography>
                  {medications.length > 1 && (
                    <IconButton onClick={() => handleRemoveMedication(index)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Medication Name"
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      required
                      fullWidth
                      error={!!formErrors[`medication_${index}_name`]}
                      helperText={formErrors[`medication_${index}_name`]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Dosage"
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      required
                      fullWidth
                      placeholder="e.g., 500mg"
                      error={!!formErrors[`medication_${index}_dosage`]}
                      helperText={formErrors[`medication_${index}_dosage`]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Frequency"
                      value={medication.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      required
                      fullWidth
                      placeholder="e.g., Twice daily"
                      error={!!formErrors[`medication_${index}_frequency`]}
                      helperText={formErrors[`medication_${index}_frequency`]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Duration"
                      value={medication.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      required
                      fullWidth
                      placeholder="e.g., 7 days"
                      error={!!formErrors[`medication_${index}_duration`]}
                      helperText={formErrors[`medication_${index}_duration`]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Instructions (Optional)"
                      value={medication.instructions || ''}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      fullWidth
                      placeholder="e.g., Take with food"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>

          {/* Diagnoses Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Diagnoses</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddDiagnosis} size="small">
                Add Diagnosis
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {diagnoses.map((diagnosis, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Diagnosis {index + 1}</Typography>
                  {diagnoses.length > 1 && (
                    <IconButton onClick={() => handleRemoveDiagnosis(index)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Condition"
                      value={diagnosis.condition}
                      onChange={(e) => handleDiagnosisChange(index, 'condition', e.target.value)}
                      required
                      fullWidth
                      error={!!formErrors[`diagnosis_${index}_condition`]}
                      helperText={formErrors[`diagnosis_${index}_condition`]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="ICD Code (Optional)"
                      value={diagnosis.icdCode || ''}
                      onChange={(e) => handleDiagnosisChange(index, 'icdCode', e.target.value)}
                      fullWidth
                      placeholder="e.g., J06.9"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notes (Optional)"
                      value={diagnosis.notes || ''}
                      onChange={(e) => handleDiagnosisChange(index, 'notes', e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>

          {/* Notes */}
          <TextField
            label="Additional Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={4}
            inputProps={{ maxLength: 1000 }}
            helperText={`${notes.length}/1000 characters`}
          />

          {/* Follow-up Date */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Follow-up Date (Optional)"
              value={followUpDate}
              onChange={(newValue) => setFollowUpDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={creating}>
          {creating ? 'Creating...' : 'Create Prescription'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePrescriptionForm
